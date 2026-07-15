import React, { Suspense, useRef, useState, useEffect, useCallback, useMemo } from "react";
import { Canvas, useThree, useFrame, useLoader } from "@react-three/fiber";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { OrbitControls, Html, useProgress, useGLTF } from "@react-three/drei";
import { clone as cloneScene } from "three/examples/jsm/utils/SkeletonUtils.js";
import * as THREE from "three";
import { useNavigate, useLocation } from "react-router-dom";

const PRIMARY = "#FF7B6B";
const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

// ── Loading overlay ─────────────────────────────────────────────────────────
const Loader: React.FC = () => {
  const { progress } = useProgress();
  return (
    <Html center>
      <div style={{
        backgroundColor: "white", borderRadius: "16px", padding: "28px 36px",
        textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", minWidth: "200px"
      }}>
        <div style={{ fontSize: "32px", marginBottom: "12px" }}>🧊</div>
        <p style={{ fontSize: "14px", fontWeight: "700", color: "#2d3436", margin: "0 0 12px 0" }}>
          Loading 3D Model…
        </p>
        <div style={{ backgroundColor: "#f0f0f0", borderRadius: "999px", height: "6px", overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: "999px",
            background: `linear-gradient(90deg, ${PRIMARY}, #FF9A84)`,
            width: `${progress}%`, transition: "width 0.2s ease"
          }} />
        </div>
        <p style={{ fontSize: "12px", color: "#999", margin: "8px 0 0 0" }}>{progress.toFixed(0)}%</p>
      </div>
    </Html>
  );
};

// ── Disease Overlay Sphere ───────────────────────────────────────────────────
const LesionSTLMesh: React.FC<{ color: string; scaleSize: number; meshRef: React.RefObject<THREE.Mesh> }> = ({ color, scaleSize, meshRef }) => {
  const geom = useLoader(STLLoader, "/output_model.stl");

  useMemo(() => {
    geom.computeBoundingBox();
    geom.center();
    
    // Normalize geometry bounds
    const size = new THREE.Vector3();
    geom.boundingBox?.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) {
      geom.scale(1 / maxDim, 1 / maxDim, 1 / maxDim);
    }
  }, [geom]);

  return (
    <mesh ref={meshRef} geometry={geom} scale={[scaleSize, scaleSize, scaleSize]}>
      <meshPhysicalMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.5}
        roughness={0.3}
        metalness={0.1}
        transparent
        opacity={0.88}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};
interface DiseaseOverlayProps {
  diagClass: string;
  lesionCxNorm: number;
  lesionCyNorm: number;
  modelBBox: THREE.Box3 | null;
}

const DiseaseOverlay: React.FC<DiseaseOverlayProps> = ({ diagClass, lesionCxNorm, lesionCyNorm, modelBBox }) => {
  const meshRef = useRef<THREE.Mesh>(null!);
  const glowRef = useRef<THREE.Mesh>(null!);
  const timeRef = useRef(0);
  const [hasSTL, setHasSTL] = useState(false);

  const isMalignant = diagClass === "Malignant";
  const isBenign    = diagClass === "Benign";
  const isNormal    = diagClass === "Normal";

  useEffect(() => {
    fetch("/output_model.stl", { method: "HEAD" })
      .then((res) => {
        if (res.ok) {
          setHasSTL(true);
        } else {
          setHasSTL(false);
        }
      })
      .catch(() => {
        setHasSTL(false);
      });
  }, []);

  // Map normalized centroid to 3D position relative to model bbox
  const position = useMemo((): [number, number, number] => {
    if (!modelBBox) return [0, 0, 0];
    const size = new THREE.Vector3();
    modelBBox.getSize(size);
    const center = new THREE.Vector3();
    modelBBox.getCenter(center);

    // Map 0→1 to [-size/2 → +size/2] relative to model center
    const x = center.x + (lesionCxNorm - 0.5) * size.x * 0.8;
    const y = center.y - (lesionCyNorm - 0.5) * size.y * 0.8; // image Y is inverted
    const z = center.z + size.z * 0.25; // slightly in front of center
    return [x, y, z];
  }, [modelBBox, lesionCxNorm, lesionCyNorm]);

  const color = isMalignant ? "#ef4444" : isBenign ? "#f59e0b" : "#22c55e";
  const glowColor = isMalignant ? "#ff0000" : isBenign ? "#fbbf24" : "#4ade80";
  const radius = isMalignant ? 0.22 : isBenign ? 0.16 : 0.10;

  useFrame((_, delta) => {
    timeRef.current += delta;
    const t = timeRef.current;

    if (meshRef.current) {
      if (isMalignant) {
        // Aggressive pulsing for malignant
        const pulse = 1 + 0.18 * Math.sin(t * 4.5);
        meshRef.current.scale.setScalar(pulse);
      } else if (isBenign) {
        const pulse = 1 + 0.08 * Math.sin(t * 2.0);
        meshRef.current.scale.setScalar(pulse);
      } else {
        meshRef.current.scale.setScalar(1);
      }
    }
    if (glowRef.current) {
      const glowPulse = 1 + 0.3 * Math.abs(Math.sin(t * (isMalignant ? 4.5 : 2.0)));
      glowRef.current.scale.setScalar(glowPulse);
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.15 + 0.12 * Math.abs(Math.sin(t * (isMalignant ? 4.5 : 2.0)));
    }
  });

  if (isNormal) return null; // No overlay for Normal

  return (
    <group position={position}>
      {/* Outer glow sphere */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[radius * 2, 16, 16]} />
        <meshBasicMaterial color={glowColor} transparent opacity={0.15} depthWrite={false} />
      </mesh>

      {/* Main lesion mesh (STL if available, otherwise fallback to sphere) */}
      <Suspense fallback={
        <mesh ref={meshRef}>
          <sphereGeometry args={[radius, 32, 32]} />
          <meshPhysicalMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.5}
            roughness={0.3}
            metalness={0.1}
            transparent
            opacity={0.88}
          />
        </mesh>
      }>
        {hasSTL ? (
          <LesionSTLMesh color={color} scaleSize={radius * 2} meshRef={meshRef} />
        ) : (
          <mesh ref={meshRef}>
            <sphereGeometry args={[radius, 32, 32]} />
            <meshPhysicalMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.5}
              roughness={0.3}
              metalness={0.1}
              transparent
              opacity={0.88}
            />
          </mesh>
        )}
      </Suspense>

      {/* Label */}
      <Html center position={[0, radius * 2.5, 0]} distanceFactor={8}>
        <div style={{
          backgroundColor: isMalignant ? "rgba(239,68,68,0.9)" : "rgba(245,158,11,0.9)",
          color: "white", padding: "3px 10px", borderRadius: "20px",
          fontSize: "11px", fontWeight: "700", whiteSpace: "nowrap",
          boxShadow: `0 0 12px ${glowColor}88`, userSelect: "none"
        }}>
          {isMalignant ? "🔴 Malignant Lesion" : "🟡 Benign Nodule"}
        </div>
      </Html>
    </group>
  );
};

// ── GLTF Mesh ───────────────────────────────────────────────────────────────
interface GLTFMeshProps {
  wireframe: boolean;
  color: string;
  opacity: number;
  onBBoxReady: (bbox: THREE.Box3) => void;
}

const GLTFMesh: React.FC<GLTFMeshProps> = ({ wireframe, color, opacity, onBBoxReady }) => {
  const { scene: rawScene } = useGLTF("/LIVER.glb");

  // Clone so mutations here don't affect other viewers sharing the cached asset
  const scene = React.useMemo(() => cloneScene(rawScene), [rawScene]);

  // Center model and compute bounding box on first load
  useEffect(() => {
    if (scene) {
      const bbox = new THREE.Box3().setFromObject(scene);
      const center = new THREE.Vector3();
      bbox.getCenter(center);
      scene.position.sub(center); // center the model

      // Recompute centered bbox
      const centeredBBox = new THREE.Box3().setFromObject(scene);
      onBBoxReady(centeredBBox);
    }
  }, [scene, onBBoxReady]);

  // Dynamically apply style controls to all child meshes
  useEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          const mat = mesh.material;
          if (mat) {
            const applyProps = (m: any) => {
              if ("color" in m && m.color) m.color.set(color);
              if ("wireframe" in m) m.wireframe = wireframe;
              if ("transparent" in m) m.transparent = opacity < 1;
              if ("opacity" in m) m.opacity = opacity;
              if ("roughness" in m) m.roughness = 0.4;
              if ("metalness" in m) m.metalness = 0.15;
              if ("side" in m) m.side = THREE.DoubleSide;
            };
            if (Array.isArray(mat)) {
              mat.forEach(applyProps);
            } else {
              applyProps(mat);
            }
          }
        }
      });
    }
  }, [scene, color, wireframe, opacity]);

  return <primitive object={scene} />;
};

// Preload the model file
useGLTF.preload("/LIVER.glb");

// ── Scene reset helper ───────────────────────────────────────────────────────
const ResetCamera: React.FC<{ trigger: number }> = ({ trigger }) => {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(0, 0, 5);
    camera.lookAt(0, 0, 0);
  }, [trigger]);
  return null;
};

// ── Main Page ────────────────────────────────────────────────────────────────
const Viewer3D: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { patientName, organ, summary } = location.state || {};

  const [wireframe, setWireframe] = useState(false);
  const [color, setColor] = useState("#4fc3f7");
  const [opacity, setOpacity] = useState(1);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [modelBBox, setModelBBox] = useState<THREE.Box3 | null>(null);

  const parsedSummary = (() => {
    try { return typeof summary === "string" ? JSON.parse(summary) : summary; }
    catch { return null; }
  })();

  const diagClass: string = parsedSummary?.class ?? "Normal";
  const lesionCxNorm: number = parsedSummary?.lesion_cx_norm ?? 0.5;
  const lesionCyNorm: number = parsedSummary?.lesion_cy_norm ?? 0.5;

  const handleBBoxReady = useCallback((bbox: THREE.Box3) => {
    setModelBBox(bbox);
  }, []);

  const colors = [
    { name: "Aqua",   hex: "#4fc3f7" },
    { name: "Salmon", hex: "#FF7B6B" },
    { name: "Lime",   hex: "#69f0ae" },
    { name: "Gold",   hex: "#ffd740" },
    { name: "White",  hex: "#f5f5f5" },
  ];

  const diagColor =
    diagClass === "Malignant" ? "#ef4444" :
    diagClass === "Benign"    ? "#f59e0b" : "#22c55e";

  return (
    <div style={{ width: "100vw", height: "100vh", backgroundColor: "#0d1117", fontFamily: FONT, display: "flex", flexDirection: "column" }}>
      <style>{`
        @keyframes pulseGlow {
          0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.4)}
          50%{box-shadow:0 0 16px 6px rgba(239,68,68,0.2)}
        }
        @keyframes fadeSlideUp {
          from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)}
        }
      `}</style>

      {/* ── Top Bar ─────────────────────────────────────────────────────── */}
      <div style={{
        height: "60px", flexShrink: 0,
        backgroundColor: "rgba(13,17,23,0.95)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 20px", backdropFilter: "blur(12px)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "8px",
            background: `linear-gradient(135deg, ${PRIMARY}, #FF9A84)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "18px", fontWeight: "bold", color: "white"
          }}>A</div>
          <div>
            <p style={{ fontSize: "15px", fontWeight: "700", color: "white", margin: 0 }}>
              3D Reconstruction Viewer
            </p>
            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", margin: 0 }}>
              {patientName || "Patient"} · {organ || "Organ"} · AI Disease Overlay
            </p>
          </div>
        </div>

        {/* Diagnosis badge */}
        {parsedSummary?.class && (
          <div style={{
            padding: "5px 14px", borderRadius: "20px",
            backgroundColor: `${diagColor}22`, border: `1px solid ${diagColor}55`,
            color: diagColor, fontSize: "13px", fontWeight: "700"
          }}>
            {diagClass === "Malignant" ? "🔴" : diagClass === "Benign" ? "🟡" : "🟢"} {diagClass}
          </div>
        )}

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => navigate("/view-4d", { state: location.state })}
            style={{
              padding: "8px 16px",
              background: "linear-gradient(135deg, #7c3aed, #a855f7)",
              border: "none", borderRadius: "8px", color: "white",
              fontSize: "13px", fontWeight: "600", cursor: "pointer"
            }}
          >🌀 Switch to 4D</button>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: "8px 14px", backgroundColor: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px",
              color: "rgba(255,255,255,0.7)", fontSize: "13px", fontWeight: "600", cursor: "pointer"
            }}
          >← Back</button>
        </div>
      </div>

      {/* ── Main Canvas Area ────────────────────────────────────────────── */}
      <div style={{ flex: 1, position: "relative" }}>
        <Canvas
          camera={{ position: [0, 0, 5], fov: 55 }}
          shadows
          style={{ backgroundColor: "#0d1117" }}
          gl={{ antialias: true, alpha: true }}
        >
          {/* Lighting */}
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 8]}  intensity={1.2} castShadow color="#ffffff" />
          <directionalLight position={[-8, -5, -6]} intensity={0.5} color="#aaddff" />
          <pointLight position={[0, 8, 0]} intensity={0.6} color="#ffffff" />

          {/* Grid */}
          <gridHelper args={[20, 20, "rgba(255,255,255,0.04)", "rgba(255,255,255,0.04)"]} position={[0, -3, 0]} />

          {/* Model + Disease Overlay */}
          <Suspense fallback={<Loader />}>
            <GLTFMesh wireframe={wireframe} color={color} opacity={opacity} onBBoxReady={handleBBoxReady} />
            {modelBBox && (
              <DiseaseOverlay
                diagClass={diagClass}
                lesionCxNorm={lesionCxNorm}
                lesionCyNorm={lesionCyNorm}
                modelBBox={modelBBox}
              />
            )}
          </Suspense>

          <ResetCamera trigger={resetTrigger} />
          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            minDistance={0.5}
            maxDistance={30}
            target={[0, 0, 0]}
          />
        </Canvas>

        {/* ── Controls Panel ─────────────────────────────────────────── */}
        <div style={{
          position: "absolute", top: "16px", right: "16px",
          backgroundColor: "rgba(13,17,23,0.88)", backdropFilter: "blur(16px)",
          borderRadius: "14px", padding: "16px", border: "1px solid rgba(255,255,255,0.08)",
          minWidth: "210px", display: "flex", flexDirection: "column", gap: "14px",
          animation: "fadeSlideUp 0.4s ease"
        }}>
          <p style={{ fontSize: "11px", fontWeight: "700", color: "rgba(255,255,255,0.4)", margin: 0, textTransform: "uppercase", letterSpacing: "1px" }}>
            Controls
          </p>

          {/* Wireframe toggle */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.8)" }}>Wireframe</span>
            <button
              onClick={() => setWireframe(w => !w)}
              style={{
                width: "42px", height: "24px", borderRadius: "12px", border: "none",
                backgroundColor: wireframe ? PRIMARY : "rgba(255,255,255,0.15)",
                cursor: "pointer", position: "relative", padding: 0, transition: "background 0.3s"
              }}
            >
              <div style={{
                position: "absolute", top: "2px", left: wireframe ? "20px" : "2px",
                width: "20px", height: "20px", borderRadius: "50%", backgroundColor: "white",
                transition: "left 0.3s", boxShadow: "0 1px 4px rgba(0,0,0,0.3)"
              }} />
            </button>
          </div>

          {/* Opacity slider */}
          <div>
            <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.8)" }}>
              Opacity — {Math.round(opacity * 100)}%
            </span>
            <input
              type="range" min={0.1} max={1} step={0.05} value={opacity}
              onChange={e => setOpacity(Number(e.target.value))}
              style={{ width: "100%", marginTop: "6px", accentColor: PRIMARY }}
            />
          </div>

          {/* Colour picker */}
          <div>
            <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.8)", display: "block", marginBottom: "8px" }}>Colour</span>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {colors.map(c => (
                <div
                  key={c.hex}
                  onClick={() => setColor(c.hex)}
                  title={c.name}
                  style={{
                    width: "24px", height: "24px", borderRadius: "50%", backgroundColor: c.hex,
                    cursor: "pointer", border: color === c.hex ? "2px solid white" : "2px solid transparent",
                    transition: "border 0.2s"
                  }}
                />
              ))}
            </div>
          </div>

          {/* Reset button */}
          <button
            onClick={() => setResetTrigger(t => t + 1)}
            style={{
              padding: "8px", backgroundColor: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px",
              color: "rgba(255,255,255,0.7)", fontSize: "12px", fontWeight: "600",
              cursor: "pointer", transition: "all 0.2s"
            }}
          >⟳ Reset Camera</button>

          {/* Download */}
          <a
            href="/LIVER.glb"
            download="liver.glb"
            style={{
              padding: "8px", backgroundColor: `${PRIMARY}20`,
              border: `1px solid ${PRIMARY}44`, borderRadius: "8px",
              color: PRIMARY, fontSize: "12px", fontWeight: "600",
              textAlign: "center", textDecoration: "none", transition: "all 0.2s"
            }}
          >⬇ Download GLB</a>
        </div>

        {/* ── Disease Legend ──────────────────────────────────────────── */}
        {parsedSummary?.class && parsedSummary.class !== "Normal" && (
          <div style={{
            position: "absolute", top: "16px", left: "16px",
            backgroundColor: "rgba(13,17,23,0.88)", backdropFilter: "blur(16px)",
            borderRadius: "14px", padding: "14px 16px",
            border: `1px solid ${diagColor}44`,
            animation: "fadeSlideUp 0.4s ease",
            maxWidth: "220px"
          }}>
            <p style={{ fontSize: "11px", fontWeight: "700", color: diagColor, margin: "0 0 8px 0", textTransform: "uppercase", letterSpacing: "1px" }}>
              Disease Overlay Active
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>Class</span>
                <span style={{ fontSize: "12px", color: diagColor, fontWeight: "700" }}>{diagClass}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>Area</span>
                <span style={{ fontSize: "12px", color: "white", fontWeight: "600" }}>{parsedSummary.segmented_area_mm2_est} mm²</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>Stiffness</span>
                <span style={{ fontSize: "12px", color: "white", fontWeight: "600" }}>{parsedSummary.stiffness_index} kPa</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>Flow</span>
                <span style={{ fontSize: "12px", color: "white", fontWeight: "600" }}>{parsedSummary.flow_strength_index}/10</span>
              </div>
            </div>
            <div style={{ marginTop: "10px", padding: "6px 10px", borderRadius: "8px", backgroundColor: `${diagColor}18` }}>
              <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", margin: 0, lineHeight: "1.5" }}>
                🔵 Sphere marks AI-detected lesion position on your model
              </p>
            </div>
          </div>
        )}

        {/* ── Info Card ──────────────────────────────────────────────── */}
        <div style={{
          position: "absolute", bottom: "16px", left: "16px",
          backgroundColor: "rgba(13,17,23,0.88)", backdropFilter: "blur(16px)",
          borderRadius: "14px", padding: "14px 16px", border: "1px solid rgba(255,255,255,0.08)",
          display: "flex", flexDirection: "column", gap: "6px"
        }}>
          <p style={{ fontSize: "11px", fontWeight: "700", color: "rgba(255,255,255,0.4)", margin: 0, textTransform: "uppercase", letterSpacing: "1px" }}>
            Model Info
          </p>
          <p style={{ fontSize: "13px", color: "white", margin: 0, fontWeight: "600" }}>
            3D Liver Reconstruction
          </p>
          <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", margin: 0 }}>
            liver.glb · 10.2 MB
          </p>
          <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", margin: "4px 0 0 0" }}>
            Drag to rotate · Scroll to zoom · Right-click to pan
          </p>
        </div>
      </div>
    </div>
  );
};

export default Viewer3D;
