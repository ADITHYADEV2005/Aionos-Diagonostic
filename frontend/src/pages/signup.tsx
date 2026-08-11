import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AionosLogo } from "@/components/AionosLogo";
import { AUTH_API_URL } from "@/config/api";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  border: "1px solid #E8E3DE",
  borderRadius: "8px",
  fontSize: "14px",
  color: "#2d3436",
  backgroundColor: "#FAF7F2",
  transition: "all 0.2s",
  boxSizing: "border-box",
};

const Signup = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("Sending OTP...");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [step, setStep] = useState<"form" | "otp">("form");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Step 1: Submit form → backend creates user and sends OTP
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!name || !email || !password) { setError("Please fill in all fields"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    setLoadingMsg("Sending OTP...");
    const controller = new AbortController();
    // 70s timeout — Render free tier cold starts take 30-50s
    const timeout = setTimeout(() => controller.abort(), 70000);
    // After 6s show a friendlier message if still loading
    const slowMsg = setTimeout(() => setLoadingMsg("Waking up server (first request takes ~30s)..."), 6000);
    try {
      const res = await fetch(`${AUTH_API_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
        signal: controller.signal,
      });
      clearTimeout(timeout); clearTimeout(slowMsg);
      const text = await res.text();
      let data: any = {};
      try { data = JSON.parse(text); } catch { throw new Error(`Bad response: ${text.slice(0, 100)}`); }

      if (res.ok) {
        setStep("otp");
        startCooldown();
      } else {
        setError(data.message || "Registration failed. Please try again.");
      }
    } catch (err: any) {
      clearTimeout(timeout); clearTimeout(slowMsg);
      if (err.name === "AbortError") {
        setError("Still starting up after 70s. Please wait a moment and try again.");
      } else {
        setError(AUTH_API_URL.includes("localhost")
          ? `Connection error: Set VITE_AUTH_API_URL in your hosting env to your live backend URL.`
          : `Could not reach backend. Please wait 10 seconds and try again.`);
      }
    } finally {
      setLoading(false);
      setLoadingMsg("Sending OTP...");
    }
  };

  // Step 2: Submit OTP → backend verifies and creates account
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const otpValue = otp.join("");
    if (otpValue.length !== 6) { setError("Please enter the complete 6-digit OTP"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${AUTH_API_URL}/verify-signup-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpValue }),
      });
      const text = await res.text();
      let data: any = {};
      try { data = JSON.parse(text); } catch { throw new Error(`Bad response: ${text.slice(0, 100)}`); }

      if (res.ok) {
        setSuccess("Account created! Redirecting to login...");
        setTimeout(() => navigate("/LoggedIn"), 1500);
      } else {
        setError(data.message || "Invalid OTP. Please try again.");
      }
    } catch {
      setError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setError("");
    try {
      await fetch(`${AUTH_API_URL}/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose: "signup" }),
      });
      startCooldown();
    } catch {
      setError("Failed to resend OTP. Please try again.");
    }
  };

  const startCooldown = () => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((prev) => { if (prev <= 1) { clearInterval(interval); return 0; } return prev - 1; });
    }, 1000);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#FAF7F2", padding: "24px", fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div style={{ width: "100%", maxWidth: "420px", backgroundColor: "white", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", border: "1px solid #f0f0f0", padding: "48px 32px" }}>

        {/* Header */}
        <div style={{ marginBottom: "32px", textAlign: "center" }}>
          <div style={{ marginBottom: "16px" }}><AionosLogo size="md" showText={false} /></div>
          <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#2d3436", margin: "0 0 8px 0" }}>
            {step === "form" ? "Create Account" : "Verify Email"}
          </h1>
          <p style={{ fontSize: "14px", color: "#666666", margin: "0" }}>
            {step === "form" ? "Register for diagnostic access" : `Enter the 6-digit code sent to ${email}`}
          </p>
        </div>

        {/* Error / Success */}
        {error && <div style={{ backgroundColor: "#fff5f5", border: "1px solid #ffb3a7", color: "#d9534f", padding: "12px 14px", borderRadius: "6px", fontSize: "13px", marginBottom: "16px" }}>{error}</div>}
        {success && <div style={{ backgroundColor: "#f0fff4", border: "1px solid #9ae6b4", color: "#276749", padding: "12px 14px", borderRadius: "6px", fontSize: "13px", marginBottom: "16px" }}>{success}</div>}

        {/* ── Form Step ── */}
        {step === "form" && (
          <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {[
              { label: "Full Name", type: "text", value: name, setter: setName, placeholder: "Dr. John Smith" },
              { label: "Email Address", type: "email", value: email, setter: setEmail, placeholder: "you@example.com" },
              { label: "Password", type: "password", value: password, setter: setPassword, placeholder: "Minimum 6 characters" },
            ].map(({ label, type, value, setter, placeholder }) => (
              <div key={label}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#2d3436", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</label>
                <input type={type} value={value} onChange={(e) => setter(e.target.value)} placeholder={placeholder} style={inputStyle}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "#FF7B6B"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(255,123,107,0.08)"; e.currentTarget.style.backgroundColor = "white"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "#E8E3DE"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.backgroundColor = "#FAF7F2"; }} required />
              </div>
            ))}
            <button type="submit" disabled={loading}
              style={{ width: "100%", padding: "12px 16px", backgroundColor: loading ? "#ccc" : "#FF7B6B", color: "white", fontSize: "14px", fontWeight: "600", border: "none", borderRadius: "8px", cursor: loading ? "not-allowed" : "pointer", transition: "all 0.3s", marginTop: "8px" }}
              onMouseOver={(e) => { if (!loading) e.currentTarget.style.backgroundColor = "#FF5A45"; }}
              onMouseOut={(e) => { if (!loading) e.currentTarget.style.backgroundColor = "#FF7B6B"; }}>
              {loading ? loadingMsg : "Create Account"}
            </button>
          </form>
        )}

        {/* ── OTP Step ── */}
        {step === "otp" && (
          <form onSubmit={handleVerifyOtp} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              {otp.map((digit, i) => (
                <input key={i} ref={(el) => { otpRefs.current[i] = el; }} type="text" inputMode="numeric" maxLength={1} value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)} onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  style={{ width: "48px", height: "56px", textAlign: "center", fontSize: "22px", fontWeight: "700", border: `2px solid ${digit ? "#FF7B6B" : "#E8E3DE"}`, borderRadius: "10px", backgroundColor: digit ? "white" : "#FAF7F2", color: "#2d3436", transition: "all 0.2s", outline: "none" }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "#FF7B6B"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(255,123,107,0.15)"; }}
                  onBlur={(e) => { if (!digit) { e.currentTarget.style.borderColor = "#E8E3DE"; e.currentTarget.style.boxShadow = "none"; } }} />
              ))}
            </div>
            <button type="submit" disabled={loading}
              style={{ width: "100%", padding: "12px 16px", backgroundColor: loading ? "#ccc" : "#FF7B6B", color: "white", fontSize: "14px", fontWeight: "600", border: "none", borderRadius: "8px", cursor: loading ? "not-allowed" : "pointer", transition: "all 0.3s" }}
              onMouseOver={(e) => { if (!loading) e.currentTarget.style.backgroundColor = "#FF5A45"; }}
              onMouseOut={(e) => { if (!loading) e.currentTarget.style.backgroundColor = "#FF7B6B"; }}>
              {loading ? "Verifying..." : "Verify & Create Account"}
            </button>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button type="button" onClick={() => { setStep("form"); setOtp(["", "", "", "", "", ""]); setError(""); }}
                style={{ background: "none", border: "none", color: "#666", fontSize: "13px", cursor: "pointer", padding: 0 }}>
                ← Go back
              </button>
              <button type="button" onClick={handleResendOtp} disabled={resendCooldown > 0}
                style={{ background: "none", border: "none", color: resendCooldown > 0 ? "#aaa" : "#FF7B6B", fontSize: "13px", fontWeight: "600", cursor: resendCooldown > 0 ? "not-allowed" : "pointer", padding: 0 }}>
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
              </button>
            </div>
          </form>
        )}

        {/* Footer */}
        <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #f0f0f0", textAlign: "center" }}>
          <p style={{ fontSize: "13px", color: "#666666", margin: "0" }}>
            Already have an account?{" "}
            <Link to="/LoggedIn" style={{ color: "#FF7B6B", textDecoration: "none", fontWeight: "600" }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
