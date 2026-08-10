import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AI_API_URL } from "@/config/api";

const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
const PRIMARY = "#FF7B6B";

type DisplayMode = "bmode" | "doppler" | "elastography" | "mask";

interface PortInfo {
  port: string;
  description: string;
}

const LiveScanDashboard: React.FC = () => {
  const navigate = useNavigate();

  const [availablePorts, setAvailablePorts] = useState<PortInfo[]>([]);
  const [selectedPort, setSelectedPort] = useState<string>("SIMULATOR");
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isSimulator, setIsSimulator] = useState<boolean>(true);
  const [currentAngle, setCurrentAngle] = useState<number>(90);

  const [activeMode, setActiveMode] = useState<DisplayMode>("bmode");
  const [ascanWaveform, setAscanWaveform] = useState<number[]>([]);

  // Images in base64 data URLs
  const [bmodeUrl, setBmodeUrl] = useState<string | null>(null);
  const [dopplerUrl, setDopplerUrl] = useState<string | null>(null);
  const [elastUrl, setElastUrl] = useState<string | null>(null);
  const [maskUrl, setMaskUrl] = useState<string | null>(null);

  // AI Diagnostic Status
  const [classification, setClassification] = useState<string>("Normal");
  const [confidence, setConfidence] = useState<number>(94.0);
  const [stiffnessIndex, setStiffnessIndex] = useState<number>(18.4);
  const [flowIndex, setFlowIndex] = useState<number>(0.52);

  const eventSourceRef = useRef<EventSource | null>(null);

  // Fetch available COM ports on mount
  useEffect(() => {
    fetch(`${AI_API_URL}/hardware/ports`)
      .then((res) => res.json())
      .then((data) => {
        if (data.ports) setAvailablePorts(data.ports);
      })
      .catch(() => {});
      
    // Auto-connect to simulator by default
    handleConnect("SIMULATOR");
    
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const handleConnect = (portToConnect: string) => {
    fetch(`${AI_API_URL}/hardware/connect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ port: portToConnect }),
    })
      .then((res) => res.json())
      .then((data) => {
        setIsConnected(true);
        setIsSimulator(data.mode?.includes("simulator"));
        startSSEStream();
      })
      .catch((err) => {
        console.error("Connect error:", err);
      });
  };

  const handleDisconnect = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    fetch(`${AI_API_URL}/hardware/disconnect`, { method: "POST" })
      .then(() => setIsConnected(false))
      .catch(() => setIsConnected(false));
  };

  const startSSEStream = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const sse = new EventSource(`${AI_API_URL}/hardware/sse`);
    eventSourceRef.current = sse;

    sse.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.status) {
          setCurrentAngle(data.status.current_angle ?? 90);
          if (data.status.active_ascan_waveform) {
            setAscanWaveform(data.status.active_ascan_waveform);
          }
        }
        if (data.bmode_b64) setBmodeUrl(`data:image/png;base64,${data.bmode_b64}`);
        if (data.doppler_b64) setDopplerUrl(`data:image/png;base64,${data.doppler_b64}`);
        if (data.elast_b64) setElastUrl(`data:image/png;base64,${data.elast_b64}`);
        if (data.mask_b64) setMaskUrl(`data:image/png;base64,${data.mask_b64}`);

        if (data.classification) setClassification(data.classification);
        if (data.confidence) setConfidence(data.confidence);
        if (data.stiffness_index) setStiffnessIndex(data.stiffness_index);
        if (data.flow_index) setFlowIndex(data.flow_index);
      } catch (e) {
        console.error("SSE parse error", e);
      }
    };
  };

  const activeImageUrl =
    activeMode === "bmode"
      ? bmodeUrl
      : activeMode === "doppler"
      ? dopplerUrl
      : activeMode === "elastography"
      ? elastUrl
      : maskUrl;

  const isMalignant = classification === "Malignant";
  const isBenign = classification === "Benign";
  const diagColor = isMalignant ? "#ef4444" : isBenign ? "#f59e0b" : "#22c55e";

  return (
    <div style={{ width: "100vw", minHeight: "100vh", backgroundColor: "#080b12", fontFamily: FONT, color: "white", display: "flex", flexDirection: "column" }}>

      {/* ── Top Header ───────────────────────────────────────────────────── */}
      <div style={{
        height: "60px", backgroundColor: "rgba(8, 11, 18, 0.96)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px", flexShrink: 0
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div>
            <h1 style={{ fontSize: "16px", fontWeight: "700", margin: 0 }}>
              Live Hardware Scanning Dashboard
            </h1>
            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", margin: 0 }}>
              RP2040 MCU Transducer USB CDC Protocol & Real-Time AI Inference Engine
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Status Badge */}
          <div style={{
            padding: "6px 14px", borderRadius: "20px",
            backgroundColor: isConnected ? (isSimulator ? "rgba(245, 158, 11, 0.15)" : "rgba(34, 197, 94, 0.15)") : "rgba(239, 68, 68, 0.15)",
            border: `1px solid ${isConnected ? (isSimulator ? "#f59e0b" : "#22c55e") : "#ef4444"}`,
            display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", fontWeight: "600",
            color: isConnected ? (isSimulator ? "#f59e0b" : "#22c55e") : "#ef4444"
          }}>
            <span style={{
              width: "8px", height: "8px", borderRadius: "50%",
              backgroundColor: isConnected ? (isSimulator ? "#f59e0b" : "#22c55e") : "#ef4444"
            }} />
            {isConnected ? (isSimulator ? "Simulator Live Sweep" : "Pico RP2040 Connected") : "Hardware Disconnected"}
          </div>

          <button
            onClick={() => navigate("/dashboard")}
            style={{
              padding: "8px 16px", backgroundColor: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px",
              color: "white", fontSize: "12px", fontWeight: "600", cursor: "pointer"
            }}
          >← Back to Dashboard</button>
        </div>
      </div>

      {/* ── Main Content Grid ────────────────────────────────────────────── */}
      <div style={{ flex: 1, padding: "20px", display: "grid", gridTemplateColumns: "320px 1fr 340px", gap: "20px" }}>

        {/* ── Left Column: Controls & A-Scan Oscilloscope ─────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/* Hardware Connection Card */}
          <div style={{
            backgroundColor: "rgba(13, 17, 23, 0.85)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "14px", padding: "18px"
          }}>
            <h3 style={{ fontSize: "14px", fontWeight: "700", margin: "0 0 12px 0", color: "#4fc3f7" }}>
              Hardware Connection
            </h3>

            <div style={{ marginBottom: "12px" }}>
              <label style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", display: "block", marginBottom: "6px" }}>
                Select Serial COM Port:
              </label>
              <select
                value={selectedPort}
                onChange={(e) => setSelectedPort(e.target.value)}
                style={{
                  width: "100%", padding: "8px 12px", backgroundColor: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px",
                  color: "white", fontSize: "12px"
                }}
              >
                <option value="SIMULATOR" style={{ backgroundColor: "#080b12" }}>Mock Hardware Simulator</option>
                {availablePorts.map((p) => (
                  <option key={p.port} value={p.port} style={{ backgroundColor: "#080b12" }}>
                    {p.port} - {p.description}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              {isConnected ? (
                <button
                  onClick={handleDisconnect}
                  style={{
                    flex: 1, padding: "10px", backgroundColor: "#ef4444",
                    border: "none", borderRadius: "8px", color: "white",
                    fontSize: "12px", fontWeight: "700", cursor: "pointer"
                  }}
                >Disconnect</button>
              ) : (
                <button
                  onClick={() => handleConnect(selectedPort)}
                  style={{
                    flex: 1, padding: "10px", backgroundColor: "#22c55e",
                    border: "none", borderRadius: "8px", color: "#080b12",
                    fontSize: "12px", fontWeight: "700", cursor: "pointer"
                  }}
                >Connect Device</button>
              )}
            </div>
          </div>

          {/* A-Scan Oscilloscope Waveform Widget */}
          <div style={{
            backgroundColor: "rgba(13, 17, 23, 0.85)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "14px", padding: "18px", flex: 1, display: "flex", flexDirection: "column"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "700", margin: 0, color: "#a855f7" }}>
                Real-Time A-Scan Oscilloscope
              </h3>
              <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>Angle: {currentAngle}°</span>
            </div>

            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", margin: "0 0 12px 0" }}>
              Returning RF Echo Voltage Envelope vs Depth (ADC0)
            </p>

            {/* SVG Oscilloscope Plot */}
            <div style={{
              flex: 1, minHeight: "180px", backgroundColor: "#04060a", borderRadius: "10px",
              border: "1px solid rgba(168,85,247,0.25)", position: "relative", overflow: "hidden",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              {/* Grid Lines */}
              <svg viewBox="0 0 300 160" preserveAspectRatio="none" style={{ position: "absolute", width: "100%", height: "100%" }}>
                <line x1="0" y1="80" x2="300" y2="80" stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />
                <line x1="75" y1="0" x2="75" y2="160" stroke="rgba(255,255,255,0.05)" />
                <line x1="150" y1="0" x2="150" y2="160" stroke="rgba(255,255,255,0.05)" />
                <line x1="225" y1="0" x2="225" y2="160" stroke="rgba(255,255,255,0.05)" />

                {/* RF Waveform Polyline */}
                {ascanWaveform.length > 0 ? (
                  <polyline
                    fill="none"
                    stroke="#c084fc"
                    strokeWidth="2"
                    points={ascanWaveform
                      .map((val, idx) => {
                        const x = (idx / (ascanWaveform.length - 1)) * 300;
                        const y = 145 - (val / 4095) * 130;
                        return `${x.toFixed(1)},${y.toFixed(1)}`;
                      })
                      .join(" ")}
                  />
                ) : (
                  <polyline
                    fill="none"
                    stroke="#c084fc"
                    strokeWidth="1.5"
                    points="0,80 50,75 100,85 150,40 200,120 250,78 300,80"
                  />
                )}
              </svg>
            </div>
          </div>
        </div>

        {/* ── Center Column: Live 2D Frame & Radial Sweep Gauge ───────────── */}
        <div style={{
          backgroundColor: "rgba(13, 17, 23, 0.85)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "14px", padding: "20px", display: "flex", flexDirection: "column", alignItems: "center"
        }}>
          
          {/* Mode Switcher Pill Bar */}
          <div style={{
            backgroundColor: "rgba(8, 11, 18, 0.9)", border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "30px", padding: "4px 8px", display: "flex", gap: "6px", marginBottom: "16px"
          }}>
            {[
              { mode: "bmode", label: "B-Mode Scan" },
              { mode: "doppler", label: "Color Doppler" },
              { mode: "elastography", label: "Elastography" },
              { mode: "mask", label: "AI Mask" },
            ].map((btn) => {
              const active = activeMode === btn.mode;
              return (
                <button
                  key={btn.mode}
                  onClick={() => setActiveMode(btn.mode as DisplayMode)}
                  style={{
                    padding: "6px 14px", borderRadius: "20px", border: "none",
                    backgroundColor: active ? PRIMARY : "transparent",
                    color: active ? "white" : "rgba(255,255,255,0.6)",
                    fontSize: "12px", fontWeight: "700", cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  {btn.label}
                </button>
              );
            })}
          </div>

          {/* 2D Ultrasound Frame Canvas Display */}
          <div style={{
            width: "420px", height: "420px", backgroundColor: "#000",
            borderRadius: "16px", border: "2px solid rgba(255,255,255,0.15)",
            position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 10px 30px rgba(0,0,0,0.7)"
          }}>
            {activeImageUrl ? (
              <img
                src={activeImageUrl}
                alt="Live Ultrasound Frame"
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            ) : (
              <div style={{ textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
                <p style={{ fontSize: "13px" }}>Waiting for ultrasound scan frames...</p>
              </div>
            )}

            {/* Sweep Line Overlay Indicator */}
            <div style={{
              position: "absolute", top: "10px", right: "12px",
              backgroundColor: "rgba(0,0,0,0.7)", borderRadius: "12px",
              padding: "4px 10px", fontSize: "11px", color: "#4fc3f7", fontWeight: "600"
            }}>
              Probe Angle: {currentAngle}°
            </div>
          </div>

          {/* 180-Degree Radial Sweep Progress Bar */}
          <div style={{ width: "100%", marginTop: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "rgba(255,255,255,0.5)", marginBottom: "6px" }}>
              <span>0° (Left Sector)</span>
              <span style={{ color: "#4fc3f7", fontWeight: "700" }}>Active Transducer Sweep: {currentAngle}°</span>
              <span>180° (Right Sector)</span>
            </div>
            <div style={{ backgroundColor: "rgba(255,255,255,0.1)", borderRadius: "10px", height: "8px", overflow: "hidden" }}>
              <div style={{
                height: "100%", backgroundColor: "#4fc3f7",
                width: `${(currentAngle / 180) * 100}%`,
                transition: "width 0.05s linear"
              }} />
            </div>
          </div>

        </div>

        {/* ── Right Column: AI Diagnostic Results Panel ───────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/* AI Diagnostic Output Card */}
          <div style={{
            backgroundColor: "rgba(13, 17, 23, 0.85)", border: `1px solid ${diagColor}44`,
            borderRadius: "14px", padding: "20px", display: "flex", flexDirection: "column", gap: "16px"
          }}>
            <h3 style={{ fontSize: "14px", fontWeight: "700", margin: 0, color: "white" }}>
              Real-Time AI Diagnosis
            </h3>

            {/* Diagnostic Classification Badge */}
            <div style={{
              backgroundColor: `${diagColor}18`, border: `1px solid ${diagColor}`,
              borderRadius: "12px", padding: "16px", textAlign: "center"
            }}>
              <p style={{ fontSize: "11px", textTransform: "uppercase", color: "rgba(255,255,255,0.6)", margin: 0, fontWeight: "600" }}>
                AI Prediction
              </p>
              <h2 style={{ fontSize: "24px", fontWeight: "800", color: diagColor, margin: "4px 0" }}>
                {classification}
              </h2>
              <p style={{ fontSize: "12px", color: "white", margin: 0, fontWeight: "600" }}>
                Confidence: {confidence}%
              </p>
            </div>

            {/* Metrics */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div style={{ backgroundColor: "rgba(255,255,255,0.04)", borderRadius: "8px", padding: "10px" }}>
                <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)", margin: 0 }}>Stiffness Index</p>
                <p style={{ fontSize: "15px", fontWeight: "700", color: "#f59e0b", margin: "2px 0 0 0" }}>{stiffnessIndex} kPa</p>
              </div>
              <div style={{ backgroundColor: "rgba(255,255,255,0.04)", borderRadius: "8px", padding: "10px" }}>
                <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)", margin: 0 }}>Flow Strength</p>
                <p style={{ fontSize: "15px", fontWeight: "700", color: "#3b82f6", margin: "2px 0 0 0" }}>{flowIndex}</p>
              </div>
            </div>

            {/* Clinical Recommendation */}
            <div style={{
              backgroundColor: "rgba(255,255,255,0.03)", borderLeft: `3px solid ${diagColor}`,
              padding: "10px 12px", borderRadius: "6px"
            }}>
              <p style={{ fontSize: "11px", fontWeight: "700", color: "rgba(255,255,255,0.8)", margin: "0 0 4px 0" }}>
                Clinical Note:
              </p>
              <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", margin: 0, lineHeight: "1.4" }}>
                {isMalignant
                  ? "Acoustic attenuation and stiff focal mass detected. Immediate bi-plane biopsy recommended."
                  : isBenign
                  ? "Isoechoic circumscribed lesion observed. Follow-up 3D volumetric scan advised."
                  : "Normal liver parenchymal echotexture with no focal acoustic lesions detected."}
              </p>
            </div>
          </div>

          {/* Action Buttons Card */}
          <div style={{
            backgroundColor: "rgba(13, 17, 23, 0.85)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "14px", padding: "18px", display: "flex", flexDirection: "column", gap: "10px"
          }}>
            <button
              onClick={() => navigate("/view-3d", { state: { patientName: "Live Scan", organ: "Liver", summary: JSON.stringify({ class: classification }) } })}
              style={{
                width: "100%", padding: "12px", backgroundColor: "#7c3aed",
                border: "none", borderRadius: "10px", color: "white",
                fontSize: "13px", fontWeight: "700", cursor: "pointer",
                boxShadow: "0 4px 14px rgba(124,58,237,0.4)"
              }}
            >View Live 3D / 4D Model</button>

            <button
              onClick={() => navigate("/final-report", { state: { patientName: "Live Hardware Patient", organ: "Liver" } })}
              style={{
                width: "100%", padding: "12px", backgroundColor: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)", borderRadius: "10px",
                color: "white", fontSize: "13px", fontWeight: "600", cursor: "pointer"
              }}
            >Generate Final Report</button>
          </div>

        </div>

      </div>
    </div>
  );
};

export default LiveScanDashboard;
