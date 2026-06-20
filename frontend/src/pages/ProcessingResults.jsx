import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const ProcessingResults = () => {
  const navigate = useNavigate();

  const handleNext = () => {
    navigate("/scan-results"); // ✅ Updated to navigate to ScanResults page
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Processing Results
      </h1>

      {/* Grid for results */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-5xl">
        {/* B-Mode */}
        <Card className="shadow-lg rounded-2xl">
          <CardContent className="p-3 flex flex-col items-center">
            <h2 className="text-lg font-semibold mb-2">B-Mode</h2>
            <img
              src="/bmode.jpg"
              alt="B-Mode"
              className="rounded-xl shadow-md w-full h-40 object-cover"
            />
          </CardContent>
        </Card>

        {/* Doppler */}
        <Card className="shadow-lg rounded-2xl">
          <CardContent className="p-3 flex flex-col items-center">
            <h2 className="text-lg font-semibold mb-2">Doppler</h2>
            <img
              src="/doppler.jpg"
              alt="Doppler"
              className="rounded-xl shadow-md w-full h-40 object-cover"
            />
          </CardContent>
        </Card>

        {/* Elastography */}
        <Card className="shadow-lg rounded-2xl">
          <CardContent className="p-3 flex flex-col items-center">
            <h2 className="text-lg font-semibold mb-2">Elastography</h2>
            <img
              src="/elastography.jpg"
              alt="Elastography"
              className="rounded-xl shadow-md w-full h-40 object-cover"
            />
          </CardContent>
        </Card>
      </div>

      {/* Next button */}
      <Button
        onClick={handleNext}
        className="mt-8 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl shadow-md"
      >
        Next →
      </Button>
    </div>
  );
};

export default ProcessingResults;

