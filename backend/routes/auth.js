import express from "express";
import mongoose from "mongoose";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { Resend } from "resend";

const router = express.Router();

// ─── Email (Resend primary, Gmail SMTP fallback) ──────────────────────────
// Lazy-initialize so startup doesn't crash if env isn't loaded yet
let _resend = null;
const getResend = () => {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
};

// ─── Helpers ───────────────────────────────────────────────────────────────
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || "your_secret_key_here", {
    expiresIn: "7d",
  });

const sendOTPEmail = async (email, otp, purpose = "verification") => {
  const subject =
    purpose === "login"
      ? "Aionos Diagnostics – Your Login OTP"
      : "Aionos Diagnostics – Verify Your Email";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #FAF7F2; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #2d3436; font-size: 24px; margin: 0;">Aionos Diagnostics</h1>
        <p style="color: #666; margin: 8px 0 0;">${purpose === "login" ? "Login Verification" : "Email Verification"}</p>
      </div>
      <div style="background: white; border-radius: 8px; padding: 24px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
        <p style="color: #555; margin: 0 0 16px;">Your one-time password (OTP) is:</p>
        <div style="font-size: 42px; font-weight: 700; letter-spacing: 12px; color: #FF7B6B; margin: 16px 0;">${otp}</div>
        <p style="color: #999; font-size: 13px; margin: 16px 0 0;">This OTP expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
      </div>
      <p style="color: #aaa; font-size: 12px; text-align: center; margin-top: 24px;">If you did not request this, you can safely ignore this email.</p>
    </div>
  `;

  // ── Try Resend first ────────────────────────────────────────────────────
  if (process.env.RESEND_API_KEY) {
    try {
      const { error } = await getResend().emails.send({
        from: "Aionos Diagnostics <onboarding@resend.dev>",
        to: email,
        subject,
        html,
      });
      if (!error) return; // success — done
      // If Resend sandbox restriction, fall through to Gmail
      if (!error.message?.includes("can only send testing emails")) {
        throw new Error(`Email send failed: ${error.message}`);
      }
      console.warn("[Auth] Resend sandbox limit hit — falling back to Gmail SMTP");
    } catch (resendErr) {
      if (!resendErr.message?.includes("can only send testing emails")) {
        throw resendErr;
      }
      console.warn("[Auth] Resend sandbox limit — falling back to Gmail SMTP");
    }
  }

  // ── Gmail SMTP fallback (nodemailer) ────────────────────────────────────
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error(
      "Email delivery failed. Please verify a domain at resend.com/domains or set EMAIL_USER/EMAIL_PASS env vars."
    );
  }

  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.default.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Aionos Diagnostics" <${process.env.EMAIL_USER}>`,
    to: email,
    subject,
    html,
  });
};


// ─── Routes ────────────────────────────────────────────────────────────────

// @route  GET /api/health
// @desc   Check server, MongoDB and email config status
router.get("/health", (req, res) => {
  res.json({
    server: "ok",
    emailConfigured: !!process.env.RESEND_API_KEY,
    mongoConnected: mongoose.connection.readyState === 1,
    mongoState: ["disconnected","connected","connecting","disconnecting"][mongoose.connection.readyState] || "unknown",
  });
});

// @route  POST /api/signup
// @desc   Register user and send OTP to email
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: "Please provide all fields" });

    if (password.length < 6)
      return res.status(400).json({ message: "Password must be at least 6 characters" });

    // Check if already verified
    const existing = await User.findOne({ email });
    if (existing && existing.isVerified)
      return res.status(400).json({ message: "Email already registered" });

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    if (existing) {
      // Update OTP for unverified user
      existing.name = name;
      existing.password = password;
      existing.otp = otp;
      existing.otpExpiry = otpExpiry;
      await existing.save();
    } else {
      await User.create({ name, email, password, otp, otpExpiry, isVerified: false });
    }

    await sendOTPEmail(email, otp, "signup");

    res.status(200).json({ success: true, message: "OTP sent to your email" });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Server error during signup", error: error.message });
  }
});

// @route  POST /api/verify-signup-otp
// @desc   Verify OTP and complete signup
router.post("/verify-signup-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found. Please sign up again." });

    if (user.isVerified) return res.status(400).json({ message: "Email already verified." });

    if (!user.otp || user.otp !== otp)
      return res.status(400).json({ message: "Invalid OTP. Please try again." });

    if (new Date() > user.otpExpiry)
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });

    user.isVerified = true;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: "Account verified successfully",
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("Verify signup OTP error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route  POST /api/login
// @desc   Validate credentials and send OTP
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Please provide email and password" });

    const user = await User.findOne({ email }).select("+password");
    if (!user) return res.status(401).json({ message: "Invalid email or password" });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ message: "Invalid email or password" });

    // Generate and send OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    await sendOTPEmail(email, otp, "login");

    res.status(200).json({ success: true, message: "OTP sent to your email" });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login", error: error.message });
  }
});

// @route  POST /api/verify-login-otp
// @desc   Verify OTP and complete login
router.post("/verify-login-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found." });

    if (!user.otp || user.otp !== otp)
      return res.status(400).json({ message: "Invalid OTP. Please try again." });

    if (new Date() > user.otpExpiry)
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });

    user.otp = null;
    user.otpExpiry = null;
    user.isVerified = true;
    await user.save();

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("Verify login OTP error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route  POST /api/resend-otp
// @desc   Resend OTP (for both login and signup)
router.post("/resend-otp", async (req, res) => {
  try {
    const { email, purpose } = req.body; // purpose: "login" | "signup"

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found." });

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    await sendOTPEmail(email, otp, purpose || "login");

    res.status(200).json({ success: true, message: "New OTP sent to your email" });
  } catch (error) {
    console.error("Resend OTP error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route  GET /api/user
// @desc   Get current user
router.get("/user", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_secret_key_here");
    const user = await User.findById(decoded.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({
      success: true,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.post("/logout", (req, res) => {
  res.json({ success: true, message: "Logout successful" });
});

export default router;
