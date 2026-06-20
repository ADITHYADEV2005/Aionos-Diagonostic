import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button"; // using shadcn/ui button

const RealtimeScreen = () => {
  const navigate = useNavigate();

  const handleNext = () => {
    // Navigate to Processing Results page
    navigate("/processing-results");
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Realtime Screen (Simulation)
      </h1>

      {/* Video element */}
      <video
        className="w-4/5 max-w-4xl rounded-2xl shadow-lg mb-6"
        autoPlay
        muted
        loop
        controls
      >
        <source src="/sample.mp4" type="video/mp4" />
        Your browser does not support HTML5 video.
      </video>

      {/* Next button */}
      <Button
        onClick={handleNext}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl shadow-md"
      >
        Next →
      </Button>
    </div>
  );
};

export default RealtimeScreen;

