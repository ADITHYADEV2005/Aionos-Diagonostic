import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AI_API_URL } from "../config/api";

export default function AIPipelinePage() {
    const location = useLocation();
    const navigate = useNavigate();
    const { patientName, patientId, organ, file } = location.state || {};

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [expandedImage, setExpandedImage] = useState(null);
    const [result, setResult] = useState({
        bmode: null,
        doppler: null,
        elast: null,
        mask: null,
        summary: null,
    });

    const callProcess = useCallback(async () => {
        if (!file) {
            setError("No scan file provided. Please upload a scan file from the dashboard.");
            return;
        }

        setLoading(true);
        setError(null);

        const BACKEND_URL = `${AI_API_URL}/patient/add`;

        try {
            const fd = new FormData();
            fd.append("file", file, file.name || "scan.png");
            fd.append("patientName", patientName || "");
            fd.append("patientId", patientId || "");
            fd.append("organ", organ || "");

            const res = await fetch(BACKEND_URL, {
                method: "POST",
                body: fd,
            });

            if (!res.ok) {
                const txt = await res.text();
                let parsedErr;
                try { parsedErr = JSON.parse(txt); } catch (e) {}
                if (parsedErr && parsedErr.error === "INVALID_ULTRASOUND_IMAGE") {
                    setError({
                        isInvalidImage: true,
                        title: parsedErr.message || "Not a Liver Ultrasound Image",
                        details: parsedErr.details || "The uploaded image does not match B-mode liver ultrasound characteristics."
                    });
                    return;
                }
                throw new Error(`Server error (${res.status}): ${txt || "No response body"}`);
            }

            const data = await res.json();
            const saved = data.patient || data;
            const summaryString = typeof saved.summary === "object"
                ? JSON.stringify(saved.summary)
                : saved.summary;

            setResult({
                bmode: saved.bmode_png_b64 ? `data:image/png;base64,${saved.bmode_png_b64}` : null,
                doppler: saved.doppler_png_b64 ? `data:image/png;base64,${saved.doppler_png_b64}` : null,
                elast: saved.elast_png_b64 ? `data:image/png;base64,${saved.elast_png_b64}` : null,
                mask: saved.mask_png_b64 ? `data:image/png;base64,${saved.mask_png_b64}` : null,
                summary: summaryString || null,
            });
        } catch (err) {
            console.error("Pipeline Error:", err);
            const message = err.message.includes("fetch")
                ? `Network Error: Could not connect to the AI server at ${AI_API_URL}. Please check if the backend is running.`
                : String(err.message || err);
            setError(message);
        } finally {
            setLoading(false);
        }
    }, [file, patientName, patientId, organ]);

    useEffect(() => {
        if (file) callProcess();
    }, [file, callProcess]);

    const parsedSummary = useMemo(() => {
        if (!result.summary) return null;
        try {
            return typeof result.summary === "string" ? JSON.parse(result.summary) : result.summary;
        } catch {
            return null;
        }
    }, [result.summary]);

    const hasResults =
        result.bmode || result.doppler || result.elast || result.mask || result.summary;

    const patientInitials = (patientName || "Patient")
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    const modalities = [
        {
            id: "bmode",
            title: "1. B-Mode Structural Ultrasound",
            subtitle: "High-contrast grayscale anatomical view for structural baseline",
            src: result.bmode,
            badge: "Anatomical Baseline",
            badgeBg: "#f3e8ff",
            badgeColor: "#7e22ce",
            borderColor: "#a855f7",
            description: "B-mode (Brightness Mode) displays a 2D cross-sectional ultrasound view showing organ contours, acoustic density, and anatomical structures."
        },
        {
            id: "doppler",
            title: "2. Color Doppler Flow Velocity Analysis",
            subtitle: "Hemodynamic vascular blood flow velocity mapping",
            src: result.doppler,
            badge: `Flow Index: ${parsedSummary?.flow_strength_index ?? "—"}`,
            badgeBg: "#e0f2fe",
            badgeColor: "#0369a1",
            borderColor: "#0284c7",
            description: "Color Doppler superposition evaluates microvascular perfusion, directional blood flow speed, and vascular turbulence surrounding the target organ area."
        },
        {
            id: "elast",
            title: "3. Strain Elastography Stiffness Mapping",
            subtitle: "Tissue elasticity and stiffness strain index heat-map",
            src: result.elast,
            badge: `Stiffness: ${parsedSummary?.stiffness_index ?? "—"}`,
            badgeBg: "#fef3c7",
            badgeColor: "#b45309",
            borderColor: "#d97706",
            description: "Elastography measures tissue mechanical strain under compression. Harder/stiffer tissue regions appear highlighted in red/warm hue spectrums."
        },
        {
            id: "mask",
            title: "4. Deep Learning AI Segmentation Mask",
            subtitle: "Automated region-of-interest boundary segmentation",
            src: result.mask,
            badge: `Area: ${parsedSummary?.segmented_area_mm2_est ?? "—"} mm²`,
            badgeBg: "#dcfce7",
            badgeColor: "#15803d",
            borderColor: "#16a34a",
            description: "Neural network segmentation delineates target tissue lesions, automatically calculating precise area contours in square millimeters."
        }
    ];

    return (
        <div style={{
            minHeight: "100vh",
            backgroundColor: "#FAF7F2",
            paddingBottom: "100px",
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
            {/* ── Top Header Navigation Bar ────────────────────────────────────────── */}
            <header style={{
                backgroundColor: "white",
                borderBottom: "1px solid #E8E3DE",
                padding: "16px 24px",
                position: "sticky",
                top: 0,
                zIndex: 20,
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
            }}>
                <div style={{
                    maxWidth: "1100px",
                    margin: "0 auto",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between"
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "10px",
                            background: "linear-gradient(135deg, #FF7B6B 0%, #FF9A84 100%)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white",
                            fontSize: "18px",
                            fontWeight: "bold"
                        }}>
                            A
                        </div>
                        <div>
                            <h1 style={{ fontSize: "18px", fontWeight: "700", color: "#2d3436", margin: 0 }}>
                                AI Diagnostic Pipeline
                            </h1>
                            <p style={{ fontSize: "12px", color: "#FF7B6B", margin: "2px 0 0 0", fontWeight: "600" }}>
                                {patientName ? `${patientName} (${patientId || "No ID"})` : "Scan Modality Analysis"}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => navigate("/dashboard")}
                        style={{
                            padding: "8px 16px",
                            backgroundColor: "#f5f5f5",
                            border: "1px solid #e0e0e0",
                            borderRadius: "8px",
                            fontSize: "13px",
                            fontWeight: "600",
                            color: "#2d3436",
                            cursor: "pointer",
                            transition: "all 0.2s"
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = "#FF7B6B";
                            e.currentTarget.style.color = "white";
                            e.currentTarget.style.borderColor = "#FF7B6B";
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = "#f5f5f5";
                            e.currentTarget.style.color = "#2d3436";
                            e.currentTarget.style.borderColor = "#e0e0e0";
                        }}
                    >
                        ← Back to Dashboard
                    </button>
                </div>
            </header>

            {/* ── Main Content Container ───────────────────────────────────────────── */}
            <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "28px 20px" }}>

                {/* ── 1. Patient & Scan Banner ────────────────────────────────────────── */}
                <div style={{
                    backgroundColor: "white",
                    borderRadius: "16px",
                    padding: "24px",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
                    border: "1px solid #f0f0f0",
                    marginBottom: "28px"
                }}>
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: "20px"
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                            <div style={{
                                width: "60px",
                                height: "60px",
                                borderRadius: "14px",
                                backgroundColor: "#FFE8E1",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "22px",
                                fontWeight: "bold",
                                color: "#FF7B6B",
                                flexShrink: 0
                            }}>
                                {patientInitials}
                            </div>
                            <div>
                                <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#2d3436", margin: "0 0 6px 0" }}>
                                    {patientName || "Unnamed Patient"}
                                </h2>
                                <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                                    <span style={{
                                        fontSize: "12px",
                                        fontWeight: "600",
                                        color: "#666",
                                        backgroundColor: "#f5f5f5",
                                        padding: "4px 10px",
                                        borderRadius: "6px"
                                    }}>
                                        Patient ID: {patientId || "N/A"}
                                    </span>
                                    <span style={{
                                        fontSize: "12px",
                                        fontWeight: "600",
                                        color: "#FF7B6B",
                                        backgroundColor: "#FFE8E1",
                                        padding: "4px 10px",
                                        borderRadius: "6px"
                                    }}>
                                        Organ Target: {organ || "General"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {file && (
                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                backgroundColor: "#FAF7F2",
                                padding: "10px 16px",
                                borderRadius: "12px",
                                border: "1px solid #E8E3DE"
                            }}>
                                <img
                                    src={URL.createObjectURL(file)}
                                    alt="Uploaded Scan"
                                    style={{
                                        width: "56px",
                                        height: "56px",
                                        objectFit: "cover",
                                        borderRadius: "8px",
                                        border: "1px solid #ccc"
                                    }}
                                />
                                <div>
                                    <p style={{ fontSize: "11px", color: "#888", margin: 0, fontWeight: "700", textTransform: "uppercase" }}>
                                        Raw Input Scan
                                    </p>
                                    <p style={{ fontSize: "13px", color: "#2d3436", margin: "2px 0 0 0", fontWeight: "600" }}>
                                        {file.name || "scan.png"}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── 2. Loading State Card ───────────────────────────────────────────── */}
                {loading && (
                    <div style={{
                        backgroundColor: "white",
                        borderRadius: "16px",
                        padding: "60px 24px",
                        textAlign: "center",
                        boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
                        border: "1px solid #f0f0f0",
                        marginBottom: "28px"
                    }}>
                        <div style={{
                            width: "60px",
                            height: "60px",
                            borderRadius: "50%",
                            border: "4px solid #FFE8E1",
                            borderTopColor: "#FF7B6B",
                            animation: "spin 1s linear infinite",
                            margin: "0 auto 20px auto"
                        }} />
                        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                        <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#2d3436", margin: "0 0 8px 0" }}>
                            Processing AI Neural Inference...
                        </h3>
                        <p style={{ fontSize: "14px", color: "#666666", margin: 0 }}>
                            Generating high-resolution B-Mode, Doppler flow velocity, elastography stiffness maps & AI segmentation.
                        </p>
                    </div>
                )}

                {/* ── 3. Error State Card ─────────────────────────────────────────────── */}
                {error && (
                    <div style={{
                        backgroundColor: error.isInvalidImage ? "#FFFBEB" : "#fff5f5",
                        borderRadius: "16px",
                        padding: "28px",
                        border: `2px solid ${error.isInvalidImage ? "#F59E0B" : "#ffcccc"}`,
                        marginBottom: "28px",
                        boxShadow: "0 4px 16px rgba(0,0,0,0.06)"
                    }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                            <div style={{ flex: 1 }}>
                                <h3 style={{
                                    fontSize: "18px",
                                    fontWeight: "700",
                                    color: error.isInvalidImage ? "#B45309" : "#d9534f",
                                    margin: "0 0 8px 0"
                                }}>
                                    {error.isInvalidImage ? error.title : "Pipeline Error Encountered"}
                                </h3>
                                <p style={{ fontSize: "14px", color: "#334155", margin: "0 0 16px 0", lineHeight: "1.6" }}>
                                    {error.isInvalidImage ? error.details : (typeof error === "string" ? error : String(error))}
                                </p>
                                {error.isInvalidImage && (
                                    <p style={{ fontSize: "13px", color: "#78350F", margin: "0 0 20px 0", fontWeight: "600" }}>
                                        Notice: The AI Pipeline is specialized for 2D B-mode Liver Ultrasound scans. Please upload a valid medical ultrasound scan file.
                                    </p>
                                )}
                                <div style={{ display: "flex", gap: "12px" }}>
                                    {error.isInvalidImage ? (
                                        <button
                                            onClick={() => navigate("/dashboard")}
                                            style={{
                                                padding: "12px 24px",
                                                backgroundColor: "#F59E0B",
                                                color: "white",
                                                border: "none",
                                                borderRadius: "8px",
                                                fontSize: "14px",
                                                fontWeight: "700",
                                                cursor: "pointer",
                                                boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3)"
                                            }}
                                        >
                                            Upload Valid Liver Ultrasound Scan
                                        </button>
                                    ) : (
                                        <button
                                            onClick={callProcess}
                                            style={{
                                                padding: "10px 20px",
                                                backgroundColor: "#d9534f",
                                                color: "white",
                                                border: "none",
                                                borderRadius: "8px",
                                                fontSize: "13px",
                                                fontWeight: "600",
                                                cursor: "pointer"
                                            }}
                                        >
                                            Retry Pipeline
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── 4. Pipeline Results Content ──────────────────────────────────────── */}
                {!loading && !error && hasResults && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>

                        {/* Quantitative Metrics Summary Card */}
                        {parsedSummary && (
                            <div style={{
                                backgroundColor: "white",
                                borderRadius: "16px",
                                padding: "24px",
                                boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
                                border: "1px solid #f0f0f0"
                            }}>
                                <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#2d3436", margin: "0 0 16px 0" }}>
                                    AI Quantitative Diagnostics
                                </h3>

                                <div style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                                    gap: "16px",
                                    marginBottom: "20px"
                                }}>
                                    <div style={{ backgroundColor: "#FAF7F2", padding: "16px", borderRadius: "12px", border: "1px solid #E8E3DE" }}>
                                        <p style={{ fontSize: "12px", color: "#666", margin: "0 0 4px 0", fontWeight: "600" }}>Segmented Area (Est.)</p>
                                        <p style={{ fontSize: "22px", fontWeight: "700", color: "#2d3436", margin: 0 }}>
                                            {parsedSummary.segmented_area_mm2_est ?? "—"} mm²
                                        </p>
                                    </div>
                                    <div style={{ backgroundColor: "#FAF7F2", padding: "16px", borderRadius: "12px", border: "1px solid #E8E3DE" }}>
                                        <p style={{ fontSize: "12px", color: "#666", margin: "0 0 4px 0", fontWeight: "600" }}>Flow Strength Index</p>
                                        <p style={{ fontSize: "22px", fontWeight: "700", color: "#0284c7", margin: 0 }}>
                                            {parsedSummary.flow_strength_index ?? "—"}
                                        </p>
                                    </div>
                                    <div style={{ backgroundColor: "#FAF7F2", padding: "16px", borderRadius: "12px", border: "1px solid #E8E3DE" }}>
                                        <p style={{ fontSize: "12px", color: "#666", margin: "0 0 4px 0", fontWeight: "600" }}>Stiffness Index</p>
                                        <p style={{ fontSize: "22px", fontWeight: "700", color: "#d97706", margin: 0 }}>
                                            {parsedSummary.stiffness_index ?? "—"}
                                        </p>
                                    </div>
                                    <div style={{ backgroundColor: "#FAF7F2", padding: "16px", borderRadius: "12px", border: "1px solid #E8E3DE" }}>
                                        <p style={{ fontSize: "12px", color: "#666", margin: "0 0 4px 0", fontWeight: "600" }}>Processing Speed</p>
                                        <p style={{ fontSize: "22px", fontWeight: "700", color: "#16a34a", margin: 0 }}>
                                            {parsedSummary.processing_time_ms ?? "—"} ms
                                        </p>
                                    </div>
                                </div>

                                {parsedSummary.interpretation && (
                                    <div style={{
                                        backgroundColor: "#FEFCE8",
                                        borderLeft: "4px solid #CA8A04",
                                        padding: "16px 20px",
                                        borderRadius: "8px",
                                        marginBottom: parsedSummary.treatment_recommendation ? "12px" : "0"
                                    }}>
                                        <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#854D0E", margin: "0 0 4px 0" }}>
                                            Clinical Interpretation
                                        </h4>
                                        <p style={{ fontSize: "14px", color: "#334155", margin: 0, lineHeight: "1.6" }}>
                                            {parsedSummary.interpretation}
                                        </p>
                                    </div>
                                )}

                                {parsedSummary.treatment_recommendation && (
                                    <div style={{
                                        backgroundColor: parsedSummary.treatment_required ? "#FEF2F2" : "#F0FDF4",
                                        borderLeft: `4px solid ${parsedSummary.treatment_required ? "#DC2626" : "#16A34A"}`,
                                        padding: "16px 20px",
                                        borderRadius: "8px"
                                    }}>
                                        <h4 style={{
                                            fontSize: "14px",
                                            fontWeight: "700",
                                            color: parsedSummary.treatment_required ? "#991B1B" : "#166534",
                                            margin: "0 0 4px 0"
                                        }}>
                                            {parsedSummary.treatment_required ? "Urgent Treatment Required" : "Recommended Action"}
                                        </h4>
                                        <p style={{ fontSize: "14px", color: "#1E293B", margin: 0, fontWeight: "600", lineHeight: "1.6" }}>
                                            {parsedSummary.treatment_recommendation}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── VERTICAL STACKED ONE-BY-ONE LARGE ANALYZED IMAGES ──────────────── */}
                        <div>
                            <h3 style={{ fontSize: "20px", fontWeight: "700", color: "#2d3436", margin: "0 0 20px 0" }}>
                                Analyzed Diagnostic Image Modalities (Full Scale Views)
                            </h3>

                            <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
                                {modalities.map((item) => (
                                    <div key={item.id} style={{
                                        backgroundColor: "white",
                                        borderRadius: "16px",
                                        padding: "28px",
                                        boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                                        border: "1px solid #f0f0f0",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "16px"
                                    }}>
                                        {/* Modality Header */}
                                        <div style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            flexWrap: "wrap",
                                            gap: "12px"
                                        }}>
                                            <div>
                                                <h4 style={{ fontSize: "18px", fontWeight: "700", color: "#2d3436", margin: "0 0 4px 0" }}>
                                                    {item.title}
                                                </h4>
                                                <p style={{ fontSize: "13px", color: "#666666", margin: 0 }}>
                                                    {item.subtitle}
                                                </p>
                                            </div>

                                            <span style={{
                                                fontSize: "12px",
                                                fontWeight: "700",
                                                backgroundColor: item.badgeBg,
                                                color: item.badgeColor,
                                                padding: "6px 14px",
                                                borderRadius: "20px"
                                            }}>
                                                {item.badge}
                                            </span>
                                        </div>

                                        {/* Large High-Resolution Image Container */}
                                        <div
                                            onClick={() => item.src && setExpandedImage({ src: item.src, title: item.title })}
                                            style={{
                                                width: "100%",
                                                height: "460px",
                                                backgroundColor: "#0d1117",
                                                borderRadius: "12px",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                overflow: "hidden",
                                                position: "relative",
                                                border: `2px solid ${item.borderColor}`,
                                                boxShadow: "0 6px 24px rgba(0,0,0,0.15)",
                                                cursor: item.src ? "pointer" : "default"
                                            }}
                                        >
                                            {item.src ? (
                                                <>
                                                    <img
                                                        src={item.src}
                                                        alt={item.title}
                                                        style={{
                                                            width: "100%",
                                                            height: "100%",
                                                            objectFit: "contain",
                                                            transition: "transform 0.3s ease"
                                                        }}
                                                    />
                                                    <div style={{
                                                        position: "absolute",
                                                        bottom: "12px",
                                                        right: "12px",
                                                        backgroundColor: "rgba(0,0,0,0.75)",
                                                        color: "white",
                                                        padding: "4px 10px",
                                                        borderRadius: "6px",
                                                        fontSize: "11px",
                                                        fontWeight: "600"
                                                    }}>
                                                        Click to Expand
                                                    </div>
                                                </>
                                            ) : (
                                                <div style={{ textAlign: "center", color: "#888" }}>
                                                    <p style={{ fontSize: "14px", margin: 0 }}>Processing modality image...</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Medical Modality Explanation */}
                                        <div style={{
                                            backgroundColor: "#FAF7F2",
                                            padding: "14px 18px",
                                            borderRadius: "10px",
                                            border: "1px solid #E8E3DE"
                                        }}>
                                            <p style={{ fontSize: "13px", color: "#475569", margin: 0, lineHeight: "1.5" }}>
                                                <strong>Clinical Utility:</strong> {item.description}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Bottom Actions Bar */}
                        <div style={{
                            backgroundColor: "white",
                            borderRadius: "16px",
                            padding: "20px 28px",
                            boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
                            border: "1px solid #f0f0f0",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            flexWrap: "wrap",
                            gap: "16px",
                            marginTop: "8px"
                        }}>
                            <button
                                onClick={callProcess}
                                style={{
                                    padding: "12px 20px",
                                    backgroundColor: "#f5f5f5",
                                    border: "1px solid #e0e0e0",
                                    borderRadius: "8px",
                                    fontSize: "13px",
                                    fontWeight: "600",
                                    color: "#2d3436",
                                    cursor: "pointer"
                                }}
                            >
                                Re-run Pipeline
                            </button>

                            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                                <button
                                    onClick={() => navigate("/view-3d", {
                                        state: { patientName, patientId, organ, summary: result.summary }
                                    })}
                                    style={{
                                        padding: "12px 22px",
                                        backgroundColor: "#0284c7",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "8px",
                                        fontSize: "13px",
                                        fontWeight: "600",
                                        cursor: "pointer",
                                        boxShadow: "0 2px 8px rgba(2, 132, 199, 0.25)"
                                    }}
                                >
                                    View 3D Model
                                </button>

                                <button
                                    onClick={() => navigate("/view-4d", {
                                        state: { patientName, patientId, organ, summary: result.summary }
                                    })}
                                    style={{
                                        padding: "12px 22px",
                                        background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "8px",
                                        fontSize: "13px",
                                        fontWeight: "600",
                                        cursor: "pointer",
                                        boxShadow: "0 2px 8px rgba(124, 58, 237, 0.25)"
                                    }}
                                >
                                    View 4D (Animated)
                                </button>

                                <button
                                    onClick={() => navigate("/final-report", {
                                        state: {
                                            summary: result.summary,
                                            images: result,
                                            patientName,
                                            patientId,
                                            organ,
                                        }
                                    })}
                                    style={{
                                        padding: "12px 26px",
                                        backgroundColor: "#16a34a",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "8px",
                                        fontSize: "13px",
                                        fontWeight: "700",
                                        cursor: "pointer",
                                        boxShadow: "0 2px 8px rgba(22, 163, 74, 0.25)"
                                    }}
                                >
                                    Go to Final Report
                                </button>
                            </div>
                        </div>

                    </div>
                )}

                {/* ── 5. Empty State ──────────────────────────────────────────────────── */}
                {!loading && !hasResults && !error && (
                    <div style={{
                        backgroundColor: "white",
                        borderRadius: "16px",
                        padding: "60px 24px",
                        textAlign: "center",
                        boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
                        border: "1px solid #f0f0f0"
                    }}>
                        <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#2d3436", margin: "0 0 8px 0" }}>
                            AI Pipeline Ready
                        </h3>
                        <p style={{ fontSize: "14px", color: "#666666", margin: "0 0 20px 0" }}>
                            Upload a scan to generate full-scale B-mode, Doppler, elastography & segmentation analysis.
                        </p>
                        <button
                            onClick={callProcess}
                            style={{
                                padding: "12px 28px",
                                backgroundColor: "#FF7B6B",
                                color: "white",
                                border: "none",
                                borderRadius: "8px",
                                fontSize: "14px",
                                fontWeight: "600",
                                cursor: "pointer",
                                boxShadow: "0 4px 12px rgba(255, 123, 107, 0.25)"
                            }}
                        >
                            Run Full Pipeline
                        </button>
                    </div>
                )}
            </main>

            {/* ── Full-Screen Lightbox Modal for Expanded View ────────────────────── */}
            {expandedImage && (
                <div
                    onClick={() => setExpandedImage(null)}
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(0,0,0,0.9)",
                        zIndex: 100,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "20px",
                        cursor: "zoom-out"
                    }}
                >
                    <div style={{ position: "absolute", top: "20px", right: "24px", color: "white", fontSize: "16px", fontWeight: "bold" }}>
                        Close
                    </div>
                    <h3 style={{ color: "white", fontSize: "18px", fontWeight: "700", marginBottom: "16px" }}>
                        {expandedImage.title}
                    </h3>
                    <img
                        src={expandedImage.src}
                        alt={expandedImage.title}
                        style={{
                            maxWidth: "92vw",
                            maxHeight: "82vh",
                            objectFit: "contain",
                            borderRadius: "12px",
                            boxShadow: "0 10px 40px rgba(0,0,0,0.8)"
                        }}
                    />
                </div>
            )}
        </div>
    );
}