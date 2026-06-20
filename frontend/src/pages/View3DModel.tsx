import React, { Suspense, useMemo } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, Html, useProgress } from "@react-three/drei";
import * as THREE from "three";
// FIX: Using .js extension for the bundler to correctly resolve the module path
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";

// --- Utility Components ---

/**
 * @name Loader
 * @description Renders a progress indicator while the 3D model is loading.
 */
const Loader: React.FC = () => {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="bg-white p-6 rounded-xl shadow-2xl flex flex-col items-center border border-indigo-200">
        <div className="text-xl font-bold text-indigo-700 mb-2 animate-pulse">
          Loading Model...
        </div>
        <div className="text-4xl font-extrabold text-indigo-500">
          {progress.toFixed(0)}%
        </div>
      </div>
    </Html>
  );
};

/**
 * @name STLModel
 * @description Loads and renders the STL geometry.
 * @param url The path or URL to the STL file.
 */
const STLModel: React.FC<{ url: string }> = ({ url }) => {
  // useLoader is the robust way to fetch the file.
  const geometry = useLoader(STLLoader, url, undefined, (loaderEvent) => {
    // Console log any loading errors, which is crucial for diagnosing 404s
    if (loaderEvent.type === 'error') {
        console.error(`❌ Load Error for ${url}. Check if the file exists in the public/ folder:`, loaderEvent);
    }
  });

  useMemo(() => {
    geometry.computeBoundingBox();
    geometry.center();
  }, [geometry]);

  const scale = 0.5;

  return (
    <mesh geometry={geometry} scale={[scale, scale, scale]}>
      <meshStandardMaterial
        color="#3b82f6"
        metalness={0.3}
        roughness={0.5}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

/**
 * @name View3DModel
 * @description Main component hosting the 3D scene and viewer controls.
 */
const View3DModel: React.FC = () => {
  // FINAL PATH: This assumes your file is at YOUR_PROJECT_ROOT/public/output_model.stl
  const modelPath = `${process.env.PUBLIC_URL}/output_model.stl`;

  return (
    <div className="w-full min-h-screen bg-gray-100 flex flex-col font-sans">
      {/* Header */}
      <div className="p-4 bg-white shadow-lg sticky top-0 z-10">
        <h1 className="text-3xl font-extrabold text-center text-indigo-800 tracking-tight">
          3D Reconstruction Viewer (Prototype)
        </h1>
        <p className="text-center text-sm text-gray-500 mt-1 truncate px-4">
          Attempting to load: **{modelPath}**
        </p>
      </div>

      {/* 3D Canvas Container */}
      <div className="flex-grow w-full h-[80vh] md:h-[90vh]">
        <Canvas
          camera={{ position: [0, 0, 5], fov: 60 }}
          style={{ backgroundColor: '#f3f4f6' }}
        >
          {/* Lighting setup */}
          <ambientLight intensity={0.8} />
          <directionalLight
            position={[10, 10, 10]}
            intensity={1.5}
            color="#ffffff"
          />
          <directionalLight
            position={[-10, -10, -10]}
            intensity={0.7}
            color="#bbbbff"
          />

          {/* Suspense boundary for loading state */}
          <Suspense fallback={<Loader />}>
            <STLModel url={modelPath} />
          </Suspense>

          {/* Orbital controls for user interaction */}
          <OrbitControls
            enableDamping
            dampingFactor={0.25}
            target={[0, 0, 0]}
            minDistance={0.5}
            maxDistance={20}
          />
        </Canvas>
      </div>
    </div>
  );
};

export default View3DModel;
