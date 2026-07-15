import { useLocation, useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function FinalReportPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const reportRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const { patientName, patientId, organ, images, summary } = location.state || {};

  // Parse summary whether it arrives as a JSON string or already an object
  let summaryObj: Record<string, unknown> | null = null;
  if (summary) {
    try {
      summaryObj = typeof summary === "string" ? JSON.parse(summary) : summary;
    } catch {
      summaryObj = null;
    }
  }

  const handleDownloadPDF = async () => {
    const el = reportRef.current;
    if (!el) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(el, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfW = 190;
      const pdfH = (canvas.height * pdfW) / canvas.width;
      const pageH = pdf.internal.pageSize.height - 20;
      let y = 10;
      let remaining = pdfH;

      pdf.addImage(imgData, "PNG", 10, y, pdfW, pdfH);
      remaining -= pageH;

      while (remaining > 0) {
        pdf.addPage();
        y = -(pdfH - remaining) - 10;
        pdf.addImage(imgData, "PNG", 10, y, pdfW, pdfH);
        remaining -= pageH;
      }

      pdf.save(`${patientName || "AionosDX"}_Report.pdf`);
    } finally {
      setDownloading(false);
    }
  };

  const scanImages = [
    { title: "B-Mode (Structural)", src: images?.bmode, color: "#3b82f6" },
    { title: "Doppler (Flow)", src: images?.doppler, color: "#ef4444" },
    { title: "Elastography (Stiffness)", src: images?.elast, color: "#f59e0b" },
    { title: "Segmentation Mask", src: images?.mask, color: "#10b981" },
  ];

  const metrics = summaryObj
    ? [
        { label: "Segmented Area (Est.)", value: `${summaryObj.segmented_area_mm2_est ?? "—"} mm²`, icon: "📐" },
        { label: "Flow Strength Index", value: String(summaryObj.flow_strength_index ?? "—"), icon: "🌊" },
        { label: "Stiffness Index", value: `${summaryObj.stiffness_index ?? "—"} kPa`, icon: "📊" },
        { label: "Processing Time", value: `${summaryObj.processing_time_ms ?? "—"} ms`, icon: "⚡" },
      ]
    : [];

  const interpretation =
    summaryObj && typeof summaryObj.interpretation === "string"
      ? summaryObj.interpretation
      : null;

  // Decide accent colour from diagnosis class
  const diagClass = summaryObj?.class 
    ? String(summaryObj.class) 
    : (String(summaryObj?.segmented_area_mm2_est ?? "").length > 0
      ? (interpretation?.toLowerCase().includes("malignan") ? "Malignant"
        : interpretation?.toLowerCase().includes("benign") ? "Benign" : "Normal")
      : "Normal");

  const statusColor =
    diagClass === "Malignant" ? "#ef4444"
    : diagClass === "Benign"   ? "#f59e0b"
    : "#10b981";

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
      padding: "24px",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      {/* ─── Top Action Bar ─────────────────────────────────────────────── */}
      <div style={{
        maxWidth: 1100,
        margin: "0 auto 20px auto",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            color: "#cbd5e1",
            padding: "10px 20px",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          ← Back to Pipeline
        </button>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={() => navigate("/dashboard")}
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "#cbd5e1",
              padding: "10px 20px",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            🏠 Dashboard
          </button>

          <button
            onClick={() => navigate("/view-3d", { state: { patientName, patientId, organ, summary } })}
            style={{
              background: "linear-gradient(135deg, #1e40af, #3b82f6)",
              border: "none",
              color: "white",
              padding: "10px 20px",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600,
              boxShadow: "0 4px 15px rgba(59,130,246,0.35)",
            }}
          >
            🧊 View 3D
          </button>

          <button
            onClick={() => navigate("/view-4d", { state: { patientName, patientId, organ, summary } })}
            style={{
              background: "linear-gradient(135deg, #7c3aed, #a855f7)",
              border: "none",
              color: "white",
              padding: "10px 20px",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600,
              boxShadow: "0 4px 15px rgba(168,85,247,0.35)",
            }}
          >
            🌀 View 4D
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            style={{
              background: downloading ? "#374151" : "linear-gradient(135deg, #10b981, #059669)",
              border: "none",
              color: "white",
              padding: "10px 24px",
              borderRadius: 8,
              cursor: downloading ? "not-allowed" : "pointer",
              fontSize: 14,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 6,
              boxShadow: downloading ? "none" : "0 4px 15px rgba(16,185,129,0.35)",
            }}
          >
            {downloading ? "⏳ Generating PDF..." : "⬇ Download PDF"}
          </button>
        </div>
      </div>

      {/* ─── Printable Report Card ──────────────────────────────────────── */}
      <div
        ref={reportRef}
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          background: "#ffffff",
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
        }}
      >
        {/* Header Banner */}
        <div style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)",
          padding: "32px 40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <div>
            <div style={{ color: "#60a5fa", fontSize: 12, letterSpacing: 3, textTransform: "uppercase", marginBottom: 6 }}>
              AIONOS DIAGNOSTICS
            </div>
            <h1 style={{ color: "white", fontSize: 28, fontWeight: 800, margin: 0 }}>
              AI Diagnostic Report
            </h1>
            <p style={{ color: "#94a3b8", margin: "6px 0 0", fontSize: 13 }}>
              Computer-Aided Ultrasound Analysis System · {new Date().toLocaleDateString("en-US", { dateStyle: "long" })}
            </p>
          </div>

          <div style={{
            background: statusColor + "22",
            border: `2px solid ${statusColor}`,
            borderRadius: 12,
            padding: "12px 24px",
            textAlign: "center",
          }}>
            <div style={{ color: statusColor, fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>
              Assessment
            </div>
            <div style={{ color: statusColor, fontSize: 22, fontWeight: 800, marginTop: 2 }}>
              {diagClass}
            </div>
          </div>
        </div>

        <div style={{ padding: "32px 40px", display: "flex", flexDirection: "column", gap: 28 }}>

          {/* ── Patient Information ── */}
          <section style={{
            background: "#f8fafc",
            borderRadius: 12,
            padding: "24px",
            border: "1px solid #e2e8f0",
          }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
              👤 Patient Information
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
              {[
                { label: "Patient Name", value: patientName || "—" },
                { label: "Patient ID", value: patientId || "—" },
                { label: "Organ Scanned", value: organ || "—" },
                { label: "Scan Date", value: new Date().toLocaleDateString() },
              ].map((item) => (
                <div key={item.label} style={{
                  background: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  padding: "12px 16px",
                }}>
                  <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Quantitative Metrics ── */}
          {metrics.length > 0 && (
            <section>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
                📈 Quantitative Metrics
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
                {metrics.map((m) => (
                  <div key={m.label} style={{
                    background: "linear-gradient(135deg, #0f172a, #1e293b)",
                    borderRadius: 12,
                    padding: "20px",
                    textAlign: "center",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}>
                    <div style={{ fontSize: 22 }}>{m.icon}</div>
                    <div style={{ color: "#60a5fa", fontSize: 22, fontWeight: 800, margin: "8px 0 4px" }}>
                      {m.value}
                    </div>
                    <div style={{ color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>
                      {m.label}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Ultrasound Images ── */}
          <section>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
              🩻 Analyzed Scan Modes
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
              {scanImages.map((img) => (
                <div key={img.title} style={{
                  background: "#f8fafc",
                  border: `1px solid ${img.color}33`,
                  borderRadius: 12,
                  overflow: "hidden",
                }}>
                  <div style={{
                    background: img.color + "15",
                    borderBottom: `2px solid ${img.color}`,
                    padding: "8px 12px",
                    fontSize: 12,
                    fontWeight: 700,
                    color: img.color,
                    textAlign: "center",
                  }}>
                    {img.title}
                  </div>
                  <div style={{ padding: 10, display: "flex", justifyContent: "center" }}>
                    {img.src ? (
                      <img
                        src={img.src}
                        alt={img.title}
                        style={{
                          width: "100%",
                          aspectRatio: "1",
                          objectFit: "contain",
                          borderRadius: 6,
                        }}
                      />
                    ) : (
                      <div style={{
                        width: "100%",
                        aspectRatio: "1",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#94a3b8",
                        fontSize: 12,
                        background: "#f1f5f9",
                        borderRadius: 6,
                      }}>
                        Not Available
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {interpretation && (
            <section style={{
              background: diagClass === "Malignant" ? "#fef2f2"
                        : diagClass === "Benign"    ? "#fffbeb"
                        : "#f0fdf4",
              border: `2px solid ${statusColor}44`,
              borderRadius: 12,
              padding: "24px",
            }}>
              <h2 style={{
                fontSize: 16, fontWeight: 700, color: statusColor, margin: "0 0 12px",
                display: "flex", alignItems: "center", gap: 8,
              }}>
                🔬 Clinical Interpretation
              </h2>
              <p style={{
                color: "#1e293b",
                lineHeight: 1.8,
                fontSize: 14,
                margin: 0,
              }}>
                {interpretation}
              </p>
            </section>
          )}

          {summaryObj && !!summaryObj.treatment_recommendation && (
            <section style={{
              background: summaryObj.treatment_required ? "#fff5f5" : "#f8fafc",
              border: `2px solid ${summaryObj.treatment_required ? "#ef4444" : "#cbd5e1"}`,
              borderRadius: 12,
              padding: "24px",
            }}>
              <h2 style={{
                fontSize: 16,
                fontWeight: 700,
                color: summaryObj.treatment_required ? "#ef4444" : "#475569",
                margin: "0 0 12px 0",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}>
                {summaryObj.treatment_required ? "🚨 Urgent Treatment Required" : "🛡️ Recommended Action"}
              </h2>
              <p style={{
                color: "#1e293b",
                lineHeight: 1.8,
                fontSize: 14,
                margin: 0,
                fontWeight: 600,
              }}>
                {String(summaryObj.treatment_recommendation)}
              </p>
            </section>
          )}

          {/* ── Footer Disclaimer ── */}
          <div style={{
            borderTop: "1px solid #e2e8f0",
            paddingTop: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <p style={{ color: "#94a3b8", fontSize: 11, margin: 0 }}>
              ⚠️ This AI-generated report is for research/decision support only. Always confirm with a qualified radiologist.
            </p>
            <p style={{ color: "#cbd5e1", fontSize: 11, margin: 0 }}>
              AIONOS Diagnostics · AI Pipeline v2.0
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
