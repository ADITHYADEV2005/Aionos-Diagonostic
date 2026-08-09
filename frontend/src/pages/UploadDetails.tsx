import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const UploadDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const file: File | undefined = location.state?.file;

  const [patientName, setPatientName] = useState("");
  const [patientId, setPatientId] = useState("");
  const [organ, setOrgan] = useState("Liver");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Send patient data + file to next page
    navigate("/ai-pipeline", {
      state: {
        patientName,
        patientId,
        organ: organ || "Liver",
        file,
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-1">Patient Scan Details</h2>
        <p className="text-xs text-center text-primary font-semibold uppercase tracking-wider mb-6">
          Implemented for Liver AI Diagnostics
        </p>

        {file && (
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-1">Selected Image:</p>
            <img
              src={URL.createObjectURL(file)}
              alt="Selected scan"
              className="w-full rounded-lg border"
            />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Patient Name"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />

          <input
            type="text"
            placeholder="Patient ID"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
              Target Organ (AI Model Implemented)
            </label>
            <input
              type="text"
              placeholder="Organ"
              value={organ}
              onChange={(e) => setOrgan(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg bg-gray-50 font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full bg-gradient-primary hover:shadow-glow text-lg font-semibold py-4 rounded-full"
          >
            Submit & Run Liver AI Pipeline
          </Button>
        </form>
      </div>
    </div>
  );
};

export default UploadDetails;

