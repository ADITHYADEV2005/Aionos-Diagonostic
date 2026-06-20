import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useProgress, Html } from "@react-three/drei";
import { STLLoader } from "node_modules/three/examples/jsm/loaders/STLLoader";
import * as THREE from "three";
import { useLoader } from "@react-three/fiber";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <p className="text-indigo-600 font-semibold">
        Loading 3D Model... {progress.toFixed(0)}%
      </p>
    </Html>
  );  
}

//  Model component to load the STL file
function Model({ url }) {
  const geometry = useLoader(STLLoader, url);
  return (
    <mesh geometry={geometry} rotation={[Math.PI / -2, 0, 0]}>
      <meshStandardMaterial color="#4f46e5" metalness={0.2} roughness={0.3} />
    </mesh>
  );
}

//  Main 3D Viewer Page
export default function ThreeDViewer() {
  const navigate = useNavigate();
  const modelPath = "/models/output_model.stl"; // Adjust path if needed

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-3xl font-bold text-indigo-700 mb-4">
         3D Reconstruction Viewer
      </h1>

      <div className="w-full h-[80vh] bg-white shadow-lg rounded-xl overflow-hidden border">
        <Canvas camera={{ position: [0, 0, 100], fov: 60 }}>
          <ambientLight intensity={0.6} />
          <pointLight position={[10, 10, 10]} />
          <Suspense fallback={<Loader />}>
            <Model url={modelPath} />
          </Suspense>
          <OrbitControls enableZoom={true} />
        </Canvas>
      </div>

      <div className="mt-6 flex gap-4">
        <Button
          onClick={() => navigate("/ai-pipeline")}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
           Back to AI Pipeline
        </Button>
      </div>
    </div>
  );
}
