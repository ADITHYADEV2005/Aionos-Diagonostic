import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AionosLogo } from "@/components/AionosLogo";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  border: "1px solid #E8E3DE",
  borderRadius: "8px",
  fontSize: "14px",
  color: "#2d3436",
  backgroundColor: "#FAF7F2",
  transition: "all 0.2s ease",
  boxSizing: "border-box",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  fontWeight: "700",
  color: "#2d3436",
  marginBottom: "6px",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const cardStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "760px",
  backgroundColor: "#ffffff",
  borderRadius: "16px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
  border: "1px solid #E8E3DE",
  padding: "36px font-sans",
  boxSizing: "border-box",
};

const buttonStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px 20px",
  backgroundColor: "#FF7B6B",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: "700",
  border: "none",
  borderRadius: "10px",
  cursor: "pointer",
  transition: "all 0.25s ease",
  marginTop: "12px",
  boxShadow: "0 4px 14px rgba(255, 123, 107, 0.3)",
};

const UploadDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const file: File | undefined = location.state?.file;

  const [patientName, setPatientName] = useState("");
  const [patientId, setPatientId] = useState("");
  const [organ, setOrgan] = useState("Liver");
  const [priority, setPriority] = useState("Routine");
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const generatePatientId = () => {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    setPatientId(`PAT-${randomNum}`);
  };

  useEffect(() => {
    if (!patientId) {
      generatePatientId();
    }

    if (file) {
      const url = URL.createObjectURL(file);
      setImagePreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    navigate("/ai-pipeline", {
      state: {
        patientName: patientName || "Anonymous Patient",
        patientId: patientId || `PAT-${Math.floor(100000 + Math.random() * 900000)}`,
        organ: organ || "Liver",
        priority,
        file,
      },
    });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FAF7F2",
        padding: "24px",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Top Header Navigation */}
      <div
        style={{
          width: "100%",
          maxWidth: "760px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          style={{
            backgroundColor: "#ffffff",
            color: "#2d3436",
            border: "1px solid #E8E3DE",
            borderRadius: "8px",
            padding: "8px 16px",
            fontSize: "13px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          ← Back to Dashboard
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <AionosLogo size="sm" showText={false} />
          <span style={{ fontSize: "14px", fontWeight: "700", color: "#2d3436" }}>
            AIONOS <span style={{ color: "#FF7B6B" }}>DIAGNOSTICS</span>
          </span>
        </div>
      </div>

      {/* Main Centered Executive Card */}
      <div style={cardStyle}>
        
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <h1 style={{ fontSize: "26px", fontWeight: "700", color: "#2d3436", margin: "0 0 6px 0" }}>
            Patient Scan Details
          </h1>
          <p style={{ fontSize: "13px", color: "#666666", margin: "0" }}>
            Calibrate patient metadata for Hepatic Shear-Wave & Segmentation Pipeline
          </p>
        </div>

        <div style={{ display: "flex", gap: "28px", flexWrap: "wrap" }}>
          
          {/* Left Column: Image Preview */}
          <div style={{ flex: "1 1 280px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", fontWeight: "700", color: "#666", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Selected B-Mode Scan
              </span>
              <span style={{ fontSize: "11px", fontWeight: "600", color: "#20B2AA", backgroundColor: "#E6F7F7", padding: "2px 8px", borderRadius: "12px" }}>
                Ultrasound Image
              </span>
            </div>

            {/* Preview Box */}
            <div
              style={{
                width: "100%",
                borderRadius: "12px",
                overflow: "hidden",
                border: "2px border-dashed #E8E3DE",
                backgroundColor: "#000000",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "220px",
                boxShadow: "inset 0 2px 6px rgba(0,0,0,0.5)",
              }}
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Ultrasound Scan"
                  style={{ width: "100%", height: "auto", maxHeight: "240px", objectFit: "contain" }}
                />
              ) : (
                <div style={{ color: "#888", fontSize: "13px", textAlign: "center", padding: "20px" }}>
                  📷 Ultrasound Scan Selected
                </div>
              )}
            </div>

            {/* File info badge */}
            {file && (
              <div
                style={{
                  backgroundColor: "#FAF7F2",
                  border: "1px solid #E8E3DE",
                  borderRadius: "8px",
                  padding: "10px 12px",
                  fontSize: "12px",
                  color: "#555",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontWeight: "600", color: "#2d3436", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "160px" }}>
                  {file.name}
                </span>
                <span style={{ color: "#888", fontSize: "11px" }}>
                  {(file.size / 1024).toFixed(0)} KB
                </span>
              </div>
            )}
          </div>

          {/* Right Column: Form Inputs */}
          <div style={{ flex: "1 1 320px" }}>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              
              {/* Patient Full Name */}
              <div>
                <label style={labelStyle}>Patient Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. John Doe"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#FF7B6B";
                    e.currentTarget.style.backgroundColor = "#ffffff";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#E8E3DE";
                    e.currentTarget.style.backgroundColor = "#FAF7F2";
                  }}
                  required
                />
              </div>

              {/* Patient ID */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Patient ID / MRN</label>
                  <button
                    type="button"
                    onClick={generatePatientId}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#FF7B6B",
                      fontSize: "11px",
                      fontWeight: "700",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    🔄 Auto-Generate
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="PAT-100294"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  style={{ ...inputStyle, fontWeight: "600", letterSpacing: "0.5px" }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#FF7B6B";
                    e.currentTarget.style.backgroundColor = "#ffffff";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#E8E3DE";
                    e.currentTarget.style.backgroundColor = "#FAF7F2";
                  }}
                  required
                />
              </div>

              {/* Target Organ Model */}
              <div>
                <label style={labelStyle}>Target Organ Model</label>
                <div
                  style={{
                    padding: "12px 16px",
                    border: "2px solid #FF7B6B",
                    borderRadius: "10px",
                    backgroundColor: "#FFF5F3",
                    color: "#FF7B6B",
                    fontSize: "13px",
                    fontWeight: "700",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span>Liver (Hepatic Ultrasound Model)</span>
                  <span style={{ fontSize: "11px", backgroundColor: "#FF7B6B", color: "#ffffff", padding: "2px 8px", borderRadius: "12px" }}>
                    Active Model
                  </span>
                </div>
              </div>

              {/* Submit CTA Button */}
              <button
                type="submit"
                style={buttonStyle}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = "#FF5A45";
                  e.currentTarget.style.boxShadow = "0 6px 18px rgba(255, 123, 107, 0.4)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = "#FF7B6B";
                  e.currentTarget.style.boxShadow = "0 4px 14px rgba(255, 123, 107, 0.3)";
                }}
              >
                Submit & Run AI Pipeline →
              </button>

            </form>
          </div>

        </div>

      </div>

      {/* Footer */}
      <div style={{ marginTop: "24px", textAlign: "center", fontSize: "12px", color: "#aaa" }}>
        Aionos Diagnostic Medical Pipeline v2.4
      </div>
    </div>
  );
};

export default UploadDetails;
