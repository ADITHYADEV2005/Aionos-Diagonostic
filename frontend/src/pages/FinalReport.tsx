// src/pages/FinalReportPage.jsx
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function FinalReportPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const reportRef = useRef();

  const { patientName, patientId, organ, images, summary } = location.state || {};

  const handleDownloadPDF = async () => {
    const reportElement = reportRef.current;
    const canvas = await html2canvas(reportElement, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const imgWidth = 190;
    const pageHeight = pdf.internal.pageSize.height;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 10;

    pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`${patientName || "report"}.pdf`);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Card className="max-w-5xl mx-auto shadow-xl border-t-4 border-indigo-500">
        <CardHeader>
          <CardTitle className="text-3xl text-center text-indigo-700 font-bold">
            AI Diagnostic Final Report
          </CardTitle>
        </CardHeader>

        <CardContent ref={reportRef} className="space-y-8">
          {/* 🧠 Patient Info */}
          <div className="bg-white p-5 rounded-lg shadow-md border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              Patient Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-gray-700">
              <p><strong>Name:</strong> {patientName || "N/A"}</p>
              <p><strong>ID:</strong> {patientId || "N/A"}</p>
              <p><strong>Organ:</strong> {organ || "N/A"}</p>
              <p><strong>Date:</strong> {new Date().toLocaleString()}</p>
            </div>
          </div>

          {/* 🖼 AI Images */}
          <div className="bg-white p-5 rounded-lg shadow-md border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              Analyzed Ultrasound Modes
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { title: "B-Mode", src: images?.bmode },
                { title: "Doppler", src: images?.doppler },
                { title: "Elastography", src: images?.elast },
                { title: "Segmentation Mask", src: images?.mask },
              ].map((img, i) => (
                <div
                  key={i}
                  className="p-3 border rounded-lg flex flex-col items-center bg-gray-50 shadow-sm"
                >
                  <h4 className="font-medium text-sm mb-2">{img.title}</h4>
                  {img.src ? (
                    <img
                      src={img.src}
                      alt={img.title}
                      className="w-32 h-32 object-contain rounded-md border"
                    />
                  ) : (
                    <p className="text-xs text-gray-400">Not Available</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 📊 Summary */}
          {summary && (
            <div className="bg-white p-5 rounded-lg shadow-md border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                AI Diagnostic Summary
              </h3>
              <div className="bg-gray-50 p-3 rounded-lg overflow-x-auto text-sm">
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(summary, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </CardContent>

        {/* Buttons */}
        <div className="flex justify-between p-6 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard")}
            className="px-6"
          >
            ← Back to Dashboard
          </Button>
          <Button
            onClick={handleDownloadPDF}
            className="bg-green-600 hover:bg-green-700 px-6"
          >
            Download as PDF
          </Button>
        </div>
      </Card>
    </div>
  );
}
