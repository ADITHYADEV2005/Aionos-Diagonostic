import React, { Suspense, useRef, useState, useEffect, useCallback, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html, useProgress, useGLTF } from "@react-three/drei";
import { clone as cloneScene } from "three/examples/jsm/utils/SkeletonUtils.js";
import * as THREE from "three";
import { useNavigate, useLocation } from "react-router-dom";

const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

export type LayerMode = "segmentation" | "elastography" | "doppler" | "bmode";

// ── Loading Indicator ────────────────────────────────────────────────────────
const Loader: React.FC = () => {
  const { progress } = useProgress();
  return (
    <Html center>
      <div style={{
        backgroundColor: "rgba(13, 17, 23, 0.92)",
        color: "white", borderRadius: "12px", padding: "16px 24px",
        textAlign: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        fontFamily: FONT, minWidth: "180px", border: "1px solid rgba(255,255,255,0.15)"
      }}>
        <p style={{ fontSize: "14px", fontWeight: "600", margin: "0 0 8px 0" }}>Loading 4D Motion Scene...</p>
        <div style={{ backgroundColor: "rgba(255,255,255,0.15)", borderRadius: "10px", height: "5px", overflow: "hidden" }}>
          <div style={{ height: "100%", backgroundColor: "#a855f7", width: `${progress}%`, transition: "width 0.2s" }} />
        </div>
        <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", margin: "6px 0 0 0" }}>{progress.toFixed(0)}%</p>
      </div>
    </Html>
  );
};

// Helper function to create True 3D Volumetric Mesh Extruded from 2D AI Segmented Mask
const create3DExtrudedSegmentGeometry = (w: number, h: number, depth: number) => {
  const shape = new THREE.Shape();
  const rx = w * 0.5;
  const ry = h * 0.45;

  shape.moveTo(0, ry);
  shape.bezierCurveTo(rx * 0.85, ry * 1.15, rx * 1.3, ry * 0.2, rx, 0);
  shape.bezierCurveTo(rx * 0.85, -ry * 0.95, rx * 0.15, -ry * 1.2, 0, -ry * 0.9);
  shape.bezierCurveTo(-rx * 0.85, -ry * 0.95, -rx * 1.25, -ry * 0.15, -rx, 0);
  shape.bezierCurveTo(-rx * 0.9, ry * 0.85, -rx * 0.25, ry * 1.05, 0, ry);

  const extrudeSettings = {
    depth: depth,
    bevelEnabled: true,
    bevelSegments: 5,
    steps: 2,
    bevelSize: depth * 0.2,
    bevelThickness: depth * 0.2,
  };

  const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geom.center();
  return geom;
};

// ── 4D Rotating Organ Model with Volumetric Assumption Mesh ────
interface Liver4DModelProps {
  playing: boolean;
  onBBoxReady: (bbox: THREE.Box3) => void;
  activeMode: LayerMode;
}

const Liver4DModel: React.FC<Liver4DModelProps> = ({ playing, onBBoxReady, activeMode }) => {
  const { scene: rawScene } = useGLTF("/LIVER.glb");

  const scene = useMemo(() => cloneScene(rawScene), [rawScene]);
  const groupRef = useRef<THREE.Group>(null!);
  const timeRef = useRef(0);
  const [modelBBox, setModelBBox] = useState<THREE.Box3 | null>(null);

  // Auto-scale LIVER.glb and center at origin
  useEffect(() => {
    if (scene) {
      const bbox = new THREE.Box3().setFromObject(scene);
      const size = new THREE.Vector3();
      bbox.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z);

      if (maxDim > 0) {
        const scale = 8.5 / maxDim;
        scene.scale.set(scale, scale, scale);
      }

      const centeredBox = new THREE.Box3().setFromObject(scene);
      const center = new THREE.Vector3();
      centeredBox.getCenter(center);
      scene.position.sub(center);

      const finalBBox = new THREE.Box3().setFromObject(scene);
      setModelBBox(finalBBox);
      onBBoxReady(finalBBox);

      scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          const mat = mesh.material;
          if (mat) {
            const applyMat = (m: any) => {
              if ("color" in m) m.color.set("#d9777f");
              if ("roughness" in m) m.roughness = 0.35;
              if ("metalness" in m) m.metalness = 0.1;
              if ("side" in m) m.side = THREE.DoubleSide;
            };
            if (Array.isArray(mat)) mat.forEach(applyMat);
            else applyMat(mat);
          }
        }
      });
    }
  }, [scene, onBBoxReady]);

  // Transform for Extruded Volumetric Assumption Mesh
  const layerTransform = useMemo(() => {
    if (!modelBBox) return null;
    const size = new THREE.Vector3();
    modelBBox.getSize(size);
    const center = new THREE.Vector3();
    modelBBox.getCenter(center);

    const w = size.x * 0.85;
    const h = size.y * 0.75;
    const depth = Math.max(0.22, size.z * 0.22);

    const extrudedGeom = create3DExtrudedSegmentGeometry(w * 0.55, h * 0.55, depth);

    return {
      volumePos: [center.x, center.y, center.z + size.z * 0.15] as [number, number, number],
      extrudedGeom,
    };
  }, [modelBBox]);

  // 4D Rotation + Breathing Motion
  useFrame((_, delta) => {
    if (!playing) return;
    timeRef.current += delta;
    const t = timeRef.current;

    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.4;
      const breathe = 1 + 0.04 * Math.sin(t * 1.8);
      groupRef.current.scale.set(breathe, breathe * 0.98, breathe);
    }
  });

  const outlineColor = activeMode === "segmentation" ? "#22c55e" :
                       activeMode === "elastography" ? "#ef4444" :
                       activeMode === "doppler" ? "#3b82f6" : "#a855f7";

  return (
    <group ref={groupRef}>
      <primitive object={scene} />

      {/* 3D Volumetric Extruded Assumption Mesh rotating in 4D Motion */}
      {modelBBox && layerTransform && (
        <group position={layerTransform.volumePos}>
          <mesh geometry={layerTransform.extrudedGeom}>
            <meshPhysicalMaterial
              color={outlineColor}
              emissive={outlineColor}
              emissiveIntensity={0.4}
              roughness={0.25}
              metalness={0.1}
              transparent
              opacity={0.82}
              side={THREE.DoubleSide}
            />
          </mesh>
          <lineSegments>
            <wireframeGeometry args={[layerTransform.extrudedGeom]} />
            <lineBasicMaterial color="#ffffff" transparent opacity={0.4} />
          </lineSegments>
        </group>
      )}
    </group>
  );
};

useGLTF.preload("/LIVER.glb");

// ── Main 4D Viewer Page ──────────────────────────────────────────────────────
const Viewer4D: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { patientName, organ, summary, segmentedImage, elastographyImage, dopplerImage, bmodeImage } = location.state || {};

  const [playing, setPlaying] = useState(true);
  const [, setModelBBox] = useState<THREE.Box3 | null>(null);
  const [activeMode, setActiveMode] = useState<LayerMode>("segmentation");

  const parsedSummary = useMemo(() => {
    try { return typeof summary === "string" ? JSON.parse(summary) : summary; }
    catch { return null; }
  }, [summary]);

  const userImages = useMemo(() => ({
    segmentation: segmentedImage || parsedSummary?.segmented_image,
    elastography: elastographyImage || parsedSummary?.elastography_image,
    doppler: dopplerImage || parsedSummary?.doppler_image,
    bmode: bmodeImage || parsedSummary?.bmode_image,
  }), [segmentedImage, elastographyImage, dopplerImage, bmodeImage, parsedSummary]);

  const handleBBoxReady = useCallback((bbox: THREE.Box3) => {
    setModelBBox(bbox);
  }, []);

  const modeButtons: { key: LayerMode; label: string; color: string }[] = [
    { key: "segmentation", label: "Segmentation Mask", color: "#22c55e" },
    { key: "elastography", label: "Elastography (Stiffness)", color: "#f59e0b" },
    { key: "doppler",      label: "Doppler (Flow)",        color: "#3b82f6" },
    { key: "bmode",        label: "B-Mode Ultrasound",     color: "#a855f7" },
  ];

  return (
    <div style={{ width: "100vw", height: "100vh", backgroundColor: "#080b12", fontFamily: FONT, display: "flex", flexDirection: "column" }}>

      {/* ── Top Header ───────────────────────────────────────────────────── */}
      <div style={{
        height: "56px", flexShrink: 0,
        backgroundColor: "rgba(8, 11, 18, 0.96)",
        borderBottom: "1px solid rgba(168, 85, 247, 0.15)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 20px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div>
            <h2 style={{ fontSize: "15px", fontWeight: "700", color: "white", margin: 0 }}>
              4D Rotating Organ & AI Pipeline Layer
            </h2>
            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", margin: 0 }}>
              {patientName || "Patient Scan"} · {organ || "Liver"} · 4D Motion
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => navigate("/view-3d", { state: location.state })}
            style={{
              padding: "8px 16px", backgroundColor: "#4fc3f7",
              border: "none", borderRadius: "8px", color: "#080b12",
              fontSize: "12px", fontWeight: "700", cursor: "pointer"
            }}
          >Switch to 3D View</button>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: "8px 14px", backgroundColor: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px",
              color: "rgba(255,255,255,0.7)", fontSize: "12px", fontWeight: "600", cursor: "pointer"
            }}
          >← Back</button>
        </div>
      </div>

      {/* ── 4D Scene Viewport ───────────────────────────────────────────── */}
      <div style={{ flex: 1, position: "relative" }}>
        <Canvas
          camera={{ position: [0, 0, 1.4], fov: 45 }}
          style={{ backgroundColor: "#080b12" }}
          gl={{ antialias: true }}
        >
          {/* Lighting */}
          <ambientLight intensity={0.8} />
          <directionalLight position={[8, 10, 8]} intensity={1.4} color="#c084fc" />
          <directionalLight position={[-8, -5, -6]} intensity={0.5} color="#7c3aed" />

          {/* 4D Rotating Organ & AI Layer */}
          <Suspense fallback={<Loader />}>
            <Liver4DModel
              playing={playing}
              onBBoxReady={handleBBoxReady}
              activeMode={activeMode}
            />
          </Suspense>

          <OrbitControls enableDamping dampingFactor={0.05} minDistance={0.5} maxDistance={20} />
        </Canvas>

        {/* ── Floating Control Panel Bar & Medical Notice Callout ─────────── */}
        <div style={{
          position: "absolute", bottom: "16px", left: "50%", transform: "translateX(-50%)",
          display: "flex", flexDirection: "column", alignItems: "center", gap: "10px",
          width: "max-content"
        }}>
          {/* AI Mode Selector Buttons */}
          <div style={{
            backgroundColor: "rgba(8, 11, 18, 0.92)", backdropFilter: "blur(12px)",
            borderRadius: "30px", padding: "6px 12px",
            border: "1px solid rgba(168,85,247,0.25)",
            display: "flex", alignItems: "center", gap: "8px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.6)"
          }}>
            {modeButtons.map(btn => {
              const isActive = activeMode === btn.key;
              return (
                <button
                  key={btn.key}
                  onClick={() => setActiveMode(btn.key)}
                  style={{
                    padding: "8px 16px", borderRadius: "20px", border: "none",
                    backgroundColor: isActive ? btn.color : "transparent",
                    color: isActive ? "#080b12" : "rgba(255,255,255,0.75)",
                    fontSize: "12px", fontWeight: "700", cursor: "pointer",
                    transition: "all 0.2s ease",
                    boxShadow: isActive ? `0 2px 10px ${btn.color}66` : "none"
                  }}
                >
                  {btn.label}
                </button>
              );
            })}
          </div>

          {/* 4D Play/Pause Toggle & Medical Disclaimer Notice */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              backgroundColor: "rgba(8, 11, 18, 0.9)",
              borderRadius: "20px", padding: "4px 14px",
              border: "1px solid rgba(255,255,255,0.1)",
              display: "flex", alignItems: "center", gap: "10px"
            }}>
              <button
                onClick={() => setPlaying(p => !p)}
                style={{
                  padding: "4px 12px", borderRadius: "16px", border: "none",
                  backgroundColor: playing ? "#a855f7" : "rgba(255,255,255,0.15)",
                  color: "white", fontSize: "11px", fontWeight: "700", cursor: "pointer"
                }}
              >{playing ? "Pause 4D" : "Play 4D"}</button>
              <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)" }}>
                {playing ? "LIVE 4D ROTATION" : "PAUSED"}
              </span>
            </div>

            <div style={{
              backgroundColor: "rgba(13, 17, 23, 0.92)", backdropFilter: "blur(8px)",
              border: "1px solid rgba(245, 158, 11, 0.35)",
              borderRadius: "20px", padding: "5px 16px",
              display: "flex", alignItems: "center", gap: "8px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.4)"
            }}>
              <span style={{ fontSize: "11px", color: "rgba(254, 215, 170, 0.9)", fontWeight: "600" }}>
                Notice: 3D Volumetric layer is an AI estimated/assumed projection based on 2D scan segmentation.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Viewer4D;
