import React, { Suspense, useRef, useState, useEffect, useMemo, useCallback } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { OrbitControls, Html, useProgress, useGLTF } from "@react-three/drei";
import { clone as cloneScene } from "three/examples/jsm/utils/SkeletonUtils.js";
import * as THREE from "three";
import { useNavigate, useLocation } from "react-router-dom";

const PRIMARY = "#a855f7";
const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

// ── Loading overlay ─────────────────────────────────────────────────────────
const Loader: React.FC = () => {
  const { progress } = useProgress();
  return (
    <Html center>
      <div style={{
        backgroundColor: "#0d1117", border: "1px solid rgba(168,85,247,0.3)",
        borderRadius: "16px", padding: "28px 36px", textAlign: "center",
        boxShadow: "0 20px 60px rgba(168,85,247,0.2)", minWidth: "200px"
      }}>
        <div style={{ fontSize: "32px", marginBottom: "12px" }}>🌀</div>
        <p style={{ fontSize: "14px", fontWeight: "700", color: "white", margin: "0 0 12px 0" }}>
          Preparing 4D Model…
        </p>
        <div style={{ backgroundColor: "rgba(255,255,255,0.1)", borderRadius: "999px", height: "6px", overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: "999px",
            background: "linear-gradient(90deg, #7c3aed, #a855f7)",
            width: `${progress}%`, transition: "width 0.2s ease"
          }} />
        </div>
        <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", margin: "8px 0 0 0" }}>{progress.toFixed(0)}%</p>
      </div>
    </Html>
  );
};

interface DiseaseOverlay4DProps {
  diagClass: string;
  lesionCxNorm: number;
  lesionCyNorm: number;
  modelBBox: THREE.Box3 | null;
  playing: boolean;
  speed: number;
}

const LesionSTLMesh4D: React.FC<{ color: string; scaleSize: number; meshRef: React.RefObject<THREE.Mesh> }> = ({ color, scaleSize, meshRef }) => {
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
        emissiveIntensity={0.6}
        roughness={0.2}
        metalness={0.15}
        transparent
        opacity={0.9}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

const DiseaseOverlay4D: React.FC<DiseaseOverlay4DProps> = ({
  diagClass, lesionCxNorm, lesionCyNorm, modelBBox, playing, speed
}) => {
  const meshRef = useRef<THREE.Mesh>(null!);
  const glowRef = useRef<THREE.Mesh>(null!);
  const timeRef = useRef(0);
  const [hasSTL, setHasSTL] = useState(false);
  const isMalignant = diagClass === "Malignant";
  const isBenign    = diagClass === "Benign";

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

  const position = useMemo((): [number, number, number] => {
    if (!modelBBox) return [0, 0, 0];
    const size = new THREE.Vector3(); modelBBox.getSize(size);
    const center = new THREE.Vector3(); modelBBox.getCenter(center);
    return [
      center.x + (lesionCxNorm - 0.5) * size.x * 0.8,
      center.y - (lesionCyNorm - 0.5) * size.y * 0.8,
      center.z + size.z * 0.25,
    ];
  }, [modelBBox, lesionCxNorm, lesionCyNorm]);

  const color     = isMalignant ? "#ef4444" : "#f59e0b";
  const glowColor = isMalignant ? "#ff0000" : "#fbbf24";
  const radius    = isMalignant ? 0.22 : 0.16;
  const rate      = isMalignant ? 4.5 : 2.0;

  useFrame((_, delta) => {
    if (!playing) return;
    timeRef.current += delta * speed;
    const t = timeRef.current;
    if (meshRef.current) {
      const pulse = 1 + (isMalignant ? 0.22 : 0.10) * Math.sin(t * rate);
      meshRef.current.scale.setScalar(pulse);
    }
    if (glowRef.current) {
      const gp = 1 + 0.4 * Math.abs(Math.sin(t * rate));
      glowRef.current.scale.setScalar(gp);
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.12 + 0.15 * Math.abs(Math.sin(t * rate));
    }
  });

  if (!isMalignant && !isBenign) return null;

  return (
    <group position={position}>
      <mesh ref={glowRef}>
        <sphereGeometry args={[radius * 2.2, 16, 16]} />
        <meshBasicMaterial color={glowColor} transparent opacity={0.12} depthWrite={false} />
      </mesh>
      
      {/* Main lesion mesh (STL if available, otherwise fallback to sphere) */}
      <Suspense fallback={
        <mesh ref={meshRef}>
          <sphereGeometry args={[radius, 32, 32]} />
          <meshPhysicalMaterial
            color={color} emissive={color} emissiveIntensity={0.6}
            roughness={0.2} metalness={0.15} transparent opacity={0.9}
          />
        </mesh>
      }>
        {hasSTL ? (
          <LesionSTLMesh4D color={color} scaleSize={radius * 2} meshRef={meshRef} />
        ) : (
          <mesh ref={meshRef}>
            <sphereGeometry args={[radius, 32, 32]} />
            <meshPhysicalMaterial
              color={color} emissive={color} emissiveIntensity={0.6}
              roughness={0.2} metalness={0.15} transparent opacity={0.9}
            />
          </mesh>
        )}
      </Suspense>

      <Html center position={[0, radius * 2.8, 0]} distanceFactor={8}>
        <div style={{
          backgroundColor: isMalignant ? "rgba(239,68,68,0.9)" : "rgba(245,158,11,0.9)",
          color: "white", padding: "3px 10px", borderRadius: "20px",
          fontSize: "11px", fontWeight: "700", whiteSpace: "nowrap",
          boxShadow: `0 0 14px ${glowColor}99`
        }}>
          {isMalignant ? "🔴 Malignant Lesion" : "🟡 Benign Nodule"}
        </div>
      </Html>
    </group>
  );
};

// ── Animated 4D Mesh ─────────────────────────────────────────────────────────
interface AnimMeshProps {
  playing: boolean;
  speed: number;
  amplitude: number;
  mode: "pulse" | "breathe" | "wave";
  onTimeUpdate: (t: number) => void;
  onBBoxReady: (bbox: THREE.Box3) => void;
}

const AnimatedMesh: React.FC<AnimMeshProps> = ({
  playing, speed, amplitude, mode, onTimeUpdate, onBBoxReady
}) => {
  const { scene: rawScene } = useGLTF("/LIVER.glb");

  // Clone so mutations here don't affect other viewers sharing the cached asset
  const scene = useMemo(() => cloneScene(rawScene), [rawScene]);
  const timeRef = useRef(0);
  const originalPositionsRef = useRef<Map<THREE.BufferGeometry, Float32Array>>(new Map());

  // Center model, compute bounding box, and save base positions on first load
  useEffect(() => {
    if (scene) {
      const bbox = new THREE.Box3().setFromObject(scene);
      const center = new THREE.Vector3();
      bbox.getCenter(center);
      scene.position.sub(center); // center the model

      // Recompute centered bbox
      const centeredBBox = new THREE.Box3().setFromObject(scene);
      onBBoxReady(centeredBBox);

      // Cache original positions
      scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          const geom = mesh.geometry;
          if (geom && geom.attributes.position) {
            geom.computeVertexNormals();
            if (!originalPositionsRef.current.has(geom)) {
              originalPositionsRef.current.set(geom, Float32Array.from(geom.attributes.position.array));
            }
          }
        }
      });
    }
  }, [scene, onBBoxReady]);

  // Deformation logic inside useFrame
  useFrame((_, delta) => {
    if (!playing || !scene) return;
    timeRef.current += delta * speed;
    const t = timeRef.current;
    onTimeUpdate(t % (Math.PI * 2));

    const amp = amplitude;

    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const geom = mesh.geometry;
        const basePositions = originalPositionsRef.current.get(geom);
        if (geom && geom.attributes.position && basePositions) {
          const pos = geom.attributes.position;
          const arr = pos.array as Float32Array;

          for (let i = 0; i < arr.length; i += 3) {
            const bx = basePositions[i];
            const by = basePositions[i + 1];
            const bz = basePositions[i + 2];
            const dist = Math.sqrt(bx * bx + by * by + bz * bz);

            let disp = 0;
            if (mode === "pulse") {
              // Radial pulse
              disp = amp * Math.sin(t * 2) * 0.5;
              const norm = dist > 0.001 ? 1 / dist : 0;
              arr[i]     = bx + bx * norm * disp;
              arr[i + 1] = by + by * norm * disp;
              arr[i + 2] = bz + bz * norm * disp;
            } else if (mode === "breathe") {
              // Breathing
              const breathe = amp * 0.6 * Math.sin(t * 1.2);
              arr[i]     = bx * (1 + breathe * 0.3);
              arr[i + 1] = by * (1 + breathe * 0.5);
              arr[i + 2] = bz * (1 + breathe * 0.3);
            } else {
              // Wave
              const wave = amp * 0.4 * Math.sin(t * 3 + dist * 2);
              const norm = dist > 0.001 ? 1 / dist : 0;
              arr[i]     = bx + bx * norm * wave;
              arr[i + 1] = by + by * norm * wave * 0.5;
              arr[i + 2] = bz + bz * norm * wave;
            }
          }
          pos.needsUpdate = true;
          geom.computeVertexNormals();
        }
      }
    });
  });

  // Apply default styles to the scene meshes
  useEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          const mat = mesh.material;
          if (mat) {
            const applyMaterialProps = (m: any) => {
              if ("color" in m) m.color.set("#a78bfa");
              if ("emissive" in m) {
                m.emissive.set("#7c3aed");
                m.emissiveIntensity = 0.12;
              }
              if ("transparent" in m) m.transparent = true;
              if ("opacity" in m) m.opacity = 0.92;
              if ("roughness" in m) m.roughness = 0.3;
              if ("metalness" in m) m.metalness = 0.15;
              if ("side" in m) m.side = THREE.DoubleSide;
            };
            if (Array.isArray(mat)) {
              mat.forEach(applyMaterialProps);
            } else {
              applyMaterialProps(mat);
            }
          }
        }
      });
    }
  }, [scene]);

  return <primitive object={scene} />;
};

useGLTF.preload("/LIVER.glb");

// ── Main 4D Page ─────────────────────────────────────────────────────────────
const Viewer4D: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { patientName, organ, summary } = location.state || {};

  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1.0);
  const [amplitude, setAmplitude] = useState(0.15);
  const [mode, setMode] = useState<"pulse" | "breathe" | "wave">("pulse");
  const [currentTime, setCurrentTime] = useState(0);
  const [bpm, setBpm] = useState(72);
  const [modelBBox, setModelBBox] = useState<THREE.Box3 | null>(null);

  // BPM tick for heartbeat animation — no state needed, driven by CSS animation
  useEffect(() => {
    if (!playing) return;
  }, [playing, bpm]);

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

  const MODES: { key: "pulse" | "breathe" | "wave"; label: string; icon: string }[] = [
    { key: "pulse",   label: "Cardiac Pulse",  icon: "💓" },
    { key: "breathe", label: "Respiratory",    icon: "🫁" },
    { key: "wave",    label: "Peristaltic",    icon: "〰️" },
  ];

  // Timeline progress — maps current phase (0–2π) to 0–100
  const timelineProgress = ((currentTime / (Math.PI * 2)) * 100).toFixed(0);

  return (
    <div style={{ width: "100vw", height: "100vh", backgroundColor: "#080b12", fontFamily: FONT, display: "flex", flexDirection: "column" }}>

      <style>{`
        @keyframes heartbeat { 0%,100%{transform:scale(1)} 50%{transform:scale(1.25)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* ── Top Bar ─────────────────────────────────────────────────────── */}
      <div style={{
        height: "60px", flexShrink: 0,
        backgroundColor: "rgba(8,11,18,0.96)",
        borderBottom: "1px solid rgba(168,85,247,0.15)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 20px", backdropFilter: "blur(12px)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "8px",
            background: "linear-gradient(135deg, #7c3aed, #a855f7)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "18px"
          }}>🌀</div>
          <div>
            <p style={{ fontSize: "15px", fontWeight: "700", color: "white", margin: 0 }}>
              4D Ultrasound Viewer
            </p>
            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", margin: 0 }}>
              {patientName || "Patient"} · {organ || "Organ"} · Live Temporal Animation
            </p>
          </div>
        </div>

        {/* BPM indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px",
          backgroundColor: "rgba(168,85,247,0.1)", padding: "6px 14px",
          borderRadius: "20px", border: "1px solid rgba(168,85,247,0.25)" }}>
          <span style={{
            fontSize: "18px",
            animation: playing ? `heartbeat ${60/bpm}s ease infinite` : "none",
            display: "inline-block"
          }}>❤️</span>
          <span style={{ fontSize: "14px", fontWeight: "700", color: "#c084fc" }}>{bpm} BPM</span>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => navigate("/view-3d", { state: location.state })}
            style={{
              padding: "8px 16px",
              background: `linear-gradient(135deg, #7c3aed, #4fc3f7)`,
              backgroundColor: "rgba(79,195,247,0.15)",
              border: "1px solid rgba(79,195,247,0.3)", borderRadius: "8px", color: "#4fc3f7",
              fontSize: "13px", fontWeight: "600", cursor: "pointer"
            }}
          >🧊 Switch to 3D</button>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: "8px 14px", backgroundColor: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px",
              color: "rgba(255,255,255,0.7)", fontSize: "13px", fontWeight: "600", cursor: "pointer"
            }}
          >← Back</button>
        </div>
      </div>

      {/* ── Canvas ──────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, position: "relative" }}>
        <Canvas camera={{ position: [0, 0, 5], fov: 55 }} shadows
          style={{ backgroundColor: "#080b12" }} gl={{ antialias: true }}>

          <ambientLight intensity={0.3} />
          <directionalLight position={[8, 10, 6]} intensity={1.0} color="#c084fc" castShadow />
          <directionalLight position={[-8, -5, -4]} intensity={0.4} color="#7c3aed" />
          <pointLight position={[0, 0, 6]} intensity={0.5} color="#e879f9" />

          <gridHelper args={[20, 20, "rgba(168,85,247,0.04)", "rgba(168,85,247,0.04)"]} position={[0, -3, 0]} />

          <Suspense fallback={<Loader />}>
            <AnimatedMesh
              playing={playing}
              speed={speed}
              amplitude={amplitude}
              mode={mode}
              onTimeUpdate={setCurrentTime}
              onBBoxReady={handleBBoxReady}
            />
            {modelBBox && (
              <DiseaseOverlay4D
                diagClass={diagClass}
                lesionCxNorm={lesionCxNorm}
                lesionCyNorm={lesionCyNorm}
                modelBBox={modelBBox}
                playing={playing}
                speed={speed}
              />
            )}
          </Suspense>

          <OrbitControls enableDamping dampingFactor={0.05} minDistance={0.5} maxDistance={30} />
        </Canvas>

        {/* ── Right Controls ─────────────────────────────────────────── */}
        <div style={{
          position: "absolute", top: "16px", right: "16px",
          backgroundColor: "rgba(8,11,18,0.9)", backdropFilter: "blur(16px)",
          borderRadius: "14px", padding: "16px", border: "1px solid rgba(168,85,247,0.15)",
          minWidth: "210px", display: "flex", flexDirection: "column", gap: "16px"
        }}>
          <p style={{ fontSize: "11px", fontWeight: "700", color: "rgba(168,85,247,0.7)", margin: 0, textTransform: "uppercase", letterSpacing: "1px" }}>
            Animation
          </p>

          {/* Mode selector */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>Cycle Mode</span>
            {MODES.map(m => (
              <button
                key={m.key}
                onClick={() => setMode(m.key)}
                style={{
                  padding: "8px 12px", borderRadius: "8px", cursor: "pointer",
                  fontSize: "12px", fontWeight: "600", textAlign: "left",
                  backgroundColor: mode === m.key ? "rgba(168,85,247,0.25)" : "rgba(255,255,255,0.05)",
                  border: mode === m.key ? "1px solid rgba(168,85,247,0.5)" : "1px solid transparent",
                  color: mode === m.key ? "#c084fc" : "rgba(255,255,255,0.5)", transition: "all 0.2s"
                }}
              >{m.icon} {m.label}</button>
            ))}
          </div>

          {/* Speed */}
          <div>
            <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>Speed — {speed.toFixed(1)}×</span>
            <input type="range" min={0.2} max={3} step={0.1} value={speed}
              onChange={e => { setSpeed(Number(e.target.value)); setBpm(Math.round(60 * Number(e.target.value))); }}
              style={{ width: "100%", marginTop: "6px", accentColor: PRIMARY }} />
          </div>

          {/* Amplitude */}
          <div>
            <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>Amplitude — {Math.round(amplitude * 100)}%</span>
            <input type="range" min={0.02} max={0.5} step={0.01} value={amplitude}
              onChange={e => setAmplitude(Number(e.target.value))}
              style={{ width: "100%", marginTop: "6px", accentColor: PRIMARY }} />
          </div>

          {/* Play/Pause */}
          <button
            onClick={() => setPlaying(p => !p)}
            style={{
              padding: "10px", borderRadius: "8px", border: "none", cursor: "pointer",
              background: playing
                ? "linear-gradient(135deg, #7c3aed, #a855f7)"
                : "rgba(255,255,255,0.08)",
              color: "white", fontSize: "14px", fontWeight: "700", transition: "all 0.2s"
            }}
          >{playing ? "⏸ Pause" : "▶ Play"}</button>
        </div>

        {/* ── Bottom Timeline ─────────────────────────────────────────── */}
        <div style={{
          position: "absolute", bottom: "16px", left: "50%", transform: "translateX(-50%)",
          backgroundColor: "rgba(8,11,18,0.9)", backdropFilter: "blur(16px)",
          borderRadius: "14px", padding: "14px 20px", border: "1px solid rgba(168,85,247,0.15)",
          minWidth: "340px", animation: "fadeIn 0.5s ease"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
            <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>
              {MODES.find(m => m.key === mode)?.icon} {MODES.find(m => m.key === mode)?.label} Cycle
            </span>
            <span style={{ fontSize: "12px", color: "#c084fc", fontWeight: "600" }}>
              {playing ? "● LIVE" : "⏸ PAUSED"}
            </span>
          </div>

          {/* Progress bar */}
          <div style={{ backgroundColor: "rgba(255,255,255,0.08)", borderRadius: "999px", height: "6px", overflow: "hidden", marginBottom: "8px" }}>
            <div style={{
              height: "100%", borderRadius: "999px",
              background: "linear-gradient(90deg, #7c3aed, #a855f7, #e879f9)",
              width: `${timelineProgress}%`, transition: "width 0.05s linear"
            }} />
          </div>

          {/* Phase labels */}
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            {["Systole", "Diastole", "Relaxation", "Fill", "Contract"].map((label, i) => (
              <span key={label} style={{
                fontSize: "10px",
                color: Number(timelineProgress) >= i * 20 ? "#c084fc" : "rgba(255,255,255,0.25)",
                fontWeight: "600", transition: "color 0.2s"
              }}>{label}</span>
            ))}
          </div>
        </div>

        {/* ── Info bottom-left ────────────────────────────────────────── */}
        <div style={{
          position: "absolute", bottom: "16px", left: "16px",
          backgroundColor: "rgba(8,11,18,0.9)", backdropFilter: "blur(16px)",
          borderRadius: "14px", padding: "14px 16px", border: "1px solid rgba(168,85,247,0.15)"
        }}>
          <p style={{ fontSize: "11px", fontWeight: "700", color: "rgba(168,85,247,0.7)", margin: "0 0 6px 0", textTransform: "uppercase", letterSpacing: "1px" }}>
            4D Parameters
          </p>
          {parsedSummary && [
            ["Class", parsedSummary.class],
            ["Area", `${parsedSummary.segmented_area_mm2_est ?? "—"} mm²`],
            ["Stiffness", `${parsedSummary.stiffness_index ?? "—"} kPa`],
            ["Flow", `${parsedSummary.flow_strength_index ?? "—"}/10`],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: "16px", marginBottom: "4px" }}>
              <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>{k}</span>
              <span style={{ fontSize: "12px", color: "white", fontWeight: "600" }}>{v}</span>
            </div>
          ))}
          <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.25)", margin: "8px 0 0 0" }}>
            Drag to rotate · Scroll to zoom
          </p>
        </div>
      </div>
    </div>
  );
};

export default Viewer4D;
