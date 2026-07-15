import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

type Phase = "scanning" | "not_found";

const PRIMARY = "#FF7B6B";
const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

const DeviceConnect: React.FC = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("scanning");
  const [dots, setDots] = useState(".");
  const [progress, setProgress] = useState(0);
  const [scanLabel, setScanLabel] = useState("Initialising scanner");

  const SCAN_STEPS = [
    { at: 0,    label: "Initialising scanner" },
    { at: 18,   label: "Broadcasting discovery signal" },
    { at: 38,   label: "Searching nearby devices" },
    { at: 58,   label: "Checking AIONOS protocol" },
    { at: 76,   label: "Scanning frequency bands" },
    { at: 90,   label: "Finalising scan" },
  ];

  // Animated dots
  useEffect(() => {
    if (phase !== "scanning") return;
    const t = setInterval(() => setDots(d => d.length >= 3 ? "." : d + "."), 500);
    return () => clearInterval(t);
  }, [phase]);

  // Progress bar + step labels
  useEffect(() => {
    if (phase !== "scanning") return;
    setProgress(0);
    let val = 0;
    const t = setInterval(() => {
      val += 0.9;
      setProgress(Math.min(val, 99));
      // Update label based on progress
      const step = [...SCAN_STEPS].reverse().find(s => val >= s.at);
      if (step) setScanLabel(step.label);
      if (val >= 99) {
        clearInterval(t);
        setTimeout(() => setPhase("not_found"), 500);
      }
    }, 60); // ~6.6 seconds total
    return () => clearInterval(t);
  }, [phase]);

  const handleRescan = () => {
    setPhase("scanning");
    setProgress(0);
    setDots(".");
    setScanLabel("Initialising scanner");
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FAF7F2", fontFamily: FONT }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{
        backgroundColor: "white", borderBottom: "1px solid #f0f0f0",
        padding: "16px 20px", position: "sticky", top: 0, zIndex: 10,
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: "640px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "40px", height: "40px", borderRadius: "10px",
              background: `linear-gradient(135deg, ${PRIMARY} 0%, #FF9A84 100%)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "white", fontSize: "18px", fontWeight: "bold"
            }}>A</div>
            <div>
              <h1 style={{ fontSize: "18px", fontWeight: "700", color: "#2d3436", margin: 0 }}>New Scan</h1>
              <p style={{ fontSize: "11px", color: PRIMARY, margin: "2px 0 0 0", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Device Setup
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            style={{ padding: "8px 16px", backgroundColor: "#f5f5f5", border: "1px solid #e0e0e0", borderRadius: "6px", fontSize: "13px", fontWeight: "600", color: "#2d3436", cursor: "pointer", transition: "all 0.2s" }}
            onMouseOver={e => { e.currentTarget.style.backgroundColor = PRIMARY; e.currentTarget.style.color = "white"; e.currentTarget.style.borderColor = PRIMARY; }}
            onMouseOut={e => { e.currentTarget.style.backgroundColor = "#f5f5f5"; e.currentTarget.style.color = "#2d3436"; e.currentTarget.style.borderColor = "#e0e0e0"; }}
          >Cancel</button>
        </div>
      </div>

      <style>{`
        @keyframes radarRing {
          0%   { transform: scale(0.5); opacity: 0.6; }
          100% { transform: scale(1.9); opacity: 0; }
        }
        @keyframes spinSlow { to { transform: rotate(360deg); } }
        @keyframes fadeIn   { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes blink    { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: "640px", margin: "0 auto", padding: "48px 24px", textAlign: "center" }}>

        {/* ── SCANNING PHASE ─────────────────────────────────────────────── */}
        {phase === "scanning" && (
          <>
            {/* Radar animation */}
            <div style={{ position: "relative", width: "200px", height: "200px", margin: "0 auto 40px" }}>
              {/* Pulse rings */}
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  position: "absolute",
                  top: "50%", left: "50%",
                  width: "100px", height: "100px",
                  marginLeft: "-50px", marginTop: "-50px",
                  borderRadius: "50%",
                  border: `2px solid ${PRIMARY}`,
                  animation: `radarRing 2.4s ease-out ${i * 0.8}s infinite`,
                }} />
              ))}
              {/* Centre disc */}
              <div style={{
                position: "absolute", top: "50%", left: "50%",
                width: "80px", height: "80px",
                marginLeft: "-40px", marginTop: "-40px",
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${PRIMARY}, #FF9A84)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "36px",
                boxShadow: `0 8px 32px rgba(255,123,107,0.35)`,
              }}>📡</div>
              {/* Spinning arc */}
              <div style={{
                position: "absolute", top: "50%", left: "50%",
                width: "140px", height: "140px",
                marginLeft: "-70px", marginTop: "-70px",
                borderRadius: "50%",
                border: `3px solid transparent`,
                borderTopColor: PRIMARY,
                borderRightColor: `${PRIMARY}55`,
                animation: "spinSlow 1.2s linear infinite",
              }} />
            </div>

            <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#2d3436", margin: "0 0 8px 0" }}>
              Searching for devices{dots}
            </h2>
            <p style={{ fontSize: "14px", color: "#888", margin: "0 0 36px 0", lineHeight: "1.6" }}>
              Make sure your AIONOS probe is powered on<br />and within Bluetooth range
            </p>

            {/* Progress bar */}
            <div style={{ backgroundColor: "#f0f0f0", borderRadius: "999px", height: "6px", overflow: "hidden", marginBottom: "12px" }}>
              <div style={{
                height: "100%", borderRadius: "999px",
                background: `linear-gradient(90deg, ${PRIMARY}, #FF9A84)`,
                width: `${progress}%`, transition: "width 0.2s ease"
              }} />
            </div>
            <p style={{ fontSize: "13px", color: "#aaa", margin: "0 0 28px 0" }}>{scanLabel}{dots}</p>

            {/* Info chips */}
            <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
              {["Bluetooth LE", "AIONOS Protocol", "2.4 GHz / 5 GHz"].map(chip => (
                <span key={chip} style={{
                  padding: "6px 14px", backgroundColor: "white", borderRadius: "20px",
                  fontSize: "12px", fontWeight: "600", color: "#888",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.06)", animation: "blink 2s ease infinite"
                }}>{chip}</span>
              ))}
            </div>
          </>
        )}

        {/* ── NO DEVICE FOUND ────────────────────────────────────────────── */}
        {phase === "not_found" && (
          <div style={{ animation: "fadeIn 0.5s ease both" }}>
            {/* Icon */}
            <div style={{
              width: "96px", height: "96px", borderRadius: "50%",
              backgroundColor: "#f5f5f5", border: "2px solid #e8e8e8",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "44px", margin: "0 auto 28px"
            }}>🔍</div>

            <h2 style={{ fontSize: "22px", fontWeight: "700", color: "#2d3436", margin: "0 0 10px 0" }}>
              No devices found
            </h2>
            <p style={{ fontSize: "14px", color: "#888", lineHeight: "1.7", margin: "0 0 36px 0" }}>
              We couldn't detect any AIONOS ultrasound probe nearby.<br />
              Please check that your device is powered on and in pairing mode.
            </p>

            {/* Tips */}
            <div style={{
              backgroundColor: "white", borderRadius: "14px",
              padding: "20px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
              textAlign: "left", marginBottom: "32px"
            }}>
              <p style={{ fontSize: "13px", fontWeight: "700", color: "#2d3436", margin: "0 0 14px 0", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Troubleshooting tips
              </p>
              {[
                { icon: "🔋", text: "Ensure the probe battery is charged" },
                { icon: "📶", text: "Move the probe closer to this device" },
                { icon: "🔄", text: "Press and hold the probe's pairing button" },
                { icon: "📱", text: "Turn Bluetooth on and off, then retry" },
              ].map(tip => (
                <div key={tip.text} style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "10px" }}>
                  <span style={{ fontSize: "18px", lineHeight: 1 }}>{tip.icon}</span>
                  <p style={{ fontSize: "13px", color: "#555", margin: 0, lineHeight: "1.5" }}>{tip.text}</p>
                </div>
              ))}
            </div>

            {/* Buttons */}
            <div style={{ display: "grid", gap: "12px" }}>
              <button
                onClick={handleRescan}
                style={{
                  padding: "14px", background: `linear-gradient(135deg, ${PRIMARY}, #FF9A84)`,
                  border: "none", borderRadius: "10px", color: "white",
                  fontSize: "15px", fontWeight: "700", cursor: "pointer", transition: "opacity 0.2s"
                }}
                onMouseOver={e => { e.currentTarget.style.opacity = "0.85"; }}
                onMouseOut={e => { e.currentTarget.style.opacity = "1"; }}
              >
                🔄 Scan Again
              </button>
              <button
                onClick={() => navigate("/upload-details")}
                style={{
                  padding: "14px", backgroundColor: "transparent",
                  border: `1.5px solid ${PRIMARY}`, borderRadius: "10px",
                  color: PRIMARY, fontSize: "14px", fontWeight: "600",
                  cursor: "pointer", transition: "all 0.2s"
                }}
                onMouseOver={e => { e.currentTarget.style.backgroundColor = `${PRIMARY}10`; }}
                onMouseOut={e => { e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                ↑ Upload scan manually instead
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeviceConnect;
