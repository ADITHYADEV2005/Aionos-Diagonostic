import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

interface ScanRecord {
  _id: string;
  patientName: string;
  patientId: string;
  organ: string;
  scanStatus: string;
  findings?: string;
  summary?: any;
  bmode_png_b64?: string;
  doppler_png_b64?: string;
  elast_png_b64?: string;
  mask_png_b64?: string;
  createdAt: string;
}

interface PatientState {
  patientId: string;
  patientName: string;
  organ?: string;
}

const PatientDetail: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const patient = location.state?.patient as PatientState | undefined;

  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!patient?.patientId) {
      setLoading(false);
      return;
    }

    fetch(`http://localhost:5000/api/patient/${patient.patientId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch patient details.");
        return res.json();
      })
      .then((data) => {
        setScans(data.scans || []);
      })
      .catch((err) => {
        console.error("Patient detail load error:", err);
        setError("Unable to load patient history.");
      })
      .finally(() => setLoading(false));
  }, [patient]);

  if (!patient) {
    return (
      <div className="min-h-screen bg-gradient-secondary p-8">
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Select a patient first</h2>
          <p className="text-muted-foreground mb-6">
            Please open a patient from the Patients or History page to view full scan history.
          </p>
          <button
            type="button"
            onClick={() => navigate("/patients")}
            className="px-6 py-3 bg-primary text-white rounded-full hover:bg-indigo-700 transition"
          >
            Go to Patients
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-secondary pb-20">
      <div className="p-4 pt-12 max-w-5xl mx-auto">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{patient.patientName}</h1>
            <p className="text-sm text-muted-foreground">Patient ID: {patient.patientId}</p>
            <p className="text-sm text-muted-foreground">Organ: {patient.organ || "Unknown"}</p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/history")}
            className="px-5 py-3 bg-primary text-white rounded-full hover:bg-indigo-700 transition"
          >
            View All Scan History
          </button>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="p-6 bg-white rounded-xl shadow-sm text-center text-muted-foreground">
              Loading patient scan history...
            </div>
          ) : error ? (
            <div className="p-6 bg-red-50 rounded-xl shadow-sm text-center text-red-700">
              {error}
            </div>
          ) : scans.length === 0 ? (
            <div className="p-6 bg-white rounded-xl shadow-sm text-center text-muted-foreground">
              No scan results found for this patient yet.
            </div>
          ) : (
            scans.map((scan) => (
              <div
                key={scan._id}
                className="bg-white rounded-xl shadow-soft border border-gray-200 p-6 hover:shadow-medium transition cursor-pointer"
                onClick={() =>
                  navigate("/final-report", {
                    state: {
                      patientName: scan.patientName,
                      patientId: scan.patientId,
                      organ: scan.organ,
                      images: {
                        bmode: scan.bmode_png_b64 ? `data:image/png;base64,${scan.bmode_png_b64}` : null,
                        doppler: scan.doppler_png_b64 ? `data:image/png;base64,${scan.doppler_png_b64}` : null,
                        elast: scan.elast_png_b64 ? `data:image/png;base64,${scan.elast_png_b64}` : null,
                        mask: scan.mask_png_b64 ? `data:image/png;base64,${scan.mask_png_b64}` : null,
                      },
                      summary: JSON.stringify(scan.summary),
                    },
                  })
                }
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-foreground">{scan.organ || "Ultrasound Scan"}</p>
                    <p className="text-sm text-muted-foreground">{new Date(scan.createdAt).toLocaleString()}</p>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                    scan.scanStatus === "Completed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-800"
                  }`}>
                    {scan.scanStatus || "Completed"}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-sm text-muted-foreground">Findings</p>
                    <p className="mt-2 text-foreground">{scan.findings || scan.summary?.interpretation || "No findings available."}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-sm text-muted-foreground">Scan ID</p>
                    <p className="mt-2 text-foreground break-words">{scan._id}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientDetail;
