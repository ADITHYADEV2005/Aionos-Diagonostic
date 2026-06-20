import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// --- New Component for Structured Summary Display ---
const SummaryDisplay = ({ summaryData }) => {
    // Safely parse the JSON string into an object
    let summary;
    try {
        summary = JSON.parse(summaryData);
    } catch (e) {
        return <p className="text-red-500">Error: Could not parse AI summary data.</p>;
    }

    if (!summary) return null;

    // Define data points to display in the main table
    const dataPoints = [
        { label: "Segmented Area (Est.)", value: `${summary.segmented_area_mm2_est} mm²` },
        { label: "Flow Strength Index", value: summary.flow_strength_index },
        { label: "Stiffness Index", value: summary.stiffness_index },
        { label: "Processing Time", value: `${summary.processing_time_ms} ms` },
    ];

    return (
        <div className="space-y-4">
            <h3 className="text-xl font-bold text-indigo-700">
                AI Diagnostic Report
            </h3>

            {/* Structured Table for Metrics */}
            <div className="grid grid-cols-2 gap-4 text-sm">
                {dataPoints.map((item) => (
                    <div key={item.label} className="p-3 bg-white rounded-md border border-gray-200">
                        <p className="font-semibold text-gray-500">{item.label}</p>
                        <p className="font-bold text-lg text-gray-800">{item.value}</p>
                    </div>
                ))}
            </div>

            {/* Human Interpretation Card */}
            <Card className="shadow-inner border-l-4 border-yellow-600 bg-yellow-50">
                <CardHeader className="py-2">
                    <CardTitle className="text-lg text-yellow-800">
                        Clinical Interpretation
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-900 leading-relaxed">
                        **{summary.interpretation}**
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};
// --- End New Component ---


export default function AIPipelinePage() {
    const location = useLocation();
    const navigate = useNavigate();
    // Destructure with default empty object for safety
    const { patientName, patientId, organ, file } = location.state || {}; 

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [result, setResult] = useState({
        bmode: null,
        doppler: null,
        elast: null,
        mask: null,
        summary: null, // This will hold the JSON string
    });

    // 🔹 Function to process AI pipeline
    const callProcess = useCallback(async () => {
        if (!file) {
            setError("No file provided. Please upload and navigate here.");
            return;
        }

        setLoading(true);
        setError(null);

        const BACKEND_URL = "http://localhost:5000/api/patient/add";

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
                throw new Error(`Server error (${res.status}): ${txt || "No response body"}`);
            }

            const data = await res.json();
            const saved = data.patient || data;
            const summaryString = typeof saved.summary === 'object'
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
                ? "Network Error: Could not connect to the backend server at 127.0.0.1:8000. Is it running?"
                : String(err.message || err);
            setError(message);
        } finally {
            setLoading(false);
        }
    }, [file, patientName, patientId, organ]);

    useEffect(() => {
        if (file) callProcess();
    }, [file, callProcess]);

    const hasResults =
        result.bmode || result.doppler || result.elast || result.mask || result.summary;

    return (
        <div className="p-6 grid gap-6 bg-gray-50 min-h-screen">
            {/* Patient Info Card (Unchanged) */}
            <Card className="shadow-lg border-t-4 border-indigo-500">
                <CardHeader>
                    <CardTitle className="text-xl text-indigo-700">
                        Patient & Upload Information
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <p>
                        <strong>Name:</strong>{" "}
                        <span className="font-medium text-gray-800">{patientName || "N/A"}</span>
                    </p>
                    <p>
                        <strong>ID:</strong>{" "}
                        <span className="font-medium text-gray-800">{patientId || "N/A"}</span>
                    </p>
                    <p>
                        <strong>Organ:</strong>{" "}
                        <span className="font-medium text-gray-800">{organ || "N/A"}</span>
                    </p>

                    {file && (
                        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-center items-center flex-col text-center">
                            <p className="text-sm text-gray-500 mb-2">Uploaded Scan Preview:</p>
                            <img
                                src={URL.createObjectURL(file)}
                                alt="Uploaded Scan"
                                className="w-40 h-40 object-contain rounded-lg shadow-md border border-gray-200"
                            />
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* AI Pipeline Analysis Card (MODIFIED) */}
            <Card className="shadow-xl">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">AI Pipeline Analysis</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6">
                    {loading && (
                        <div className="p-4 text-center text-lg font-semibold text-indigo-600 bg-indigo-50 rounded-lg">
                            Running full pipeline... please wait.
                        </div>
                    )}

                    {error && (
                        <div className="p-4 bg-red-100 text-red-700 rounded-lg border border-red-300 shadow-sm">
                            <h3 className="font-bold text-lg mb-2">Pipeline Error Encountered!</h3>
                            <p className="whitespace-pre-wrap">{error}</p>
                            <div className="mt-4">
                                <Button onClick={callProcess} className="bg-red-600 hover:bg-red-700">
                                    Retry Pipeline
                                </Button>
                            </div>
                        </div>
                    )}

                    {!loading && !error && hasResults && (
                        <>
                            {/* Summary Display: Uses the new component */}
                            {result.summary && (
                                <div className="border p-4 rounded-lg bg-gray-100">
                                    <SummaryDisplay summaryData={result.summary} />
                                </div>
                            )}

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {/* Image displays (Unchanged) */}
                                {[
                                    { title: "B-Mode (Structural)", src: result.bmode, alt: "B-mode" },
                                    { title: "Doppler (Flow)", src: result.doppler, alt: "Doppler" },
                                    { title: "Elastography (Stiffness)", src: result.elast, alt: "Elastography" },
                                    { title: "Segmentation Mask", src: result.mask, alt: "Mask" },
                                ].map((img, index) => (
                                    <div
                                        key={index}
                                        className="bg-white p-3 rounded-lg shadow-md border border-gray-100 flex flex-col items-center"
                                    >
                                        <h4 className="font-medium text-sm mb-1 text-gray-700 text-center">
                                            {img.title}
                                        </h4>
                                        {img.src ? (
                                            <img
                                                src={img.src}
                                                alt={img.alt}
                                                className="w-40 h-40 object-contain rounded-lg border shadow-sm"
                                            />
                                        ) : (
                                            <p className="text-xs text-gray-400 text-center">
                                                Analysis pending
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Action Buttons (Unchanged) */}
                            <div className="flex gap-4 mt-6 justify-end">
                                <Button
                                    onClick={() =>
                                        navigate("/final-report", {
                                            state: {
                                                // Assuming the final report page will parse the string back to JSON
                                                summary: result.summary, 
                                                images: result,
                                                patientName,
                                                patientId,
                                                organ,
                                            },
                                        })
                                    }
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    Go to Final Report
                                </Button>

                                <Button variant="outline" onClick={callProcess}>
                                    Re-run Pipeline
                                </Button>
                            </div>
                        </>
                    )}

                    {!loading && !hasResults && !error && (
                        <div className="space-y-3 p-4 bg-gray-100 rounded-lg border text-center">
                            <p>Pipeline is ready to run for the uploaded scan.</p>
                            <Button onClick={callProcess} className="w-full">
                                Run Full Pipeline
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}