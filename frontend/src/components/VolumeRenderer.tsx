import React, { useRef, useEffect } from 'react';

// --- Utility: Simulate 3D Data Stack ---
// In a real application, this function would load multiple segmented 2D images (like segmented.png),
// stack them based on spatial coordinates, and convert them into a 3D data structure (volume).
const generate3DVolume = (depth: number, size: number) => {
  const volume = new Array(depth).fill(0).map(() => 
    new Array(size).fill(0).map(() => 
      new Array(size).fill(0)
    )
  );

  // Simulate a tumor shape (e.g., an ellipsoid in the center)
  const center = size / 2;
  const radius = size / 4;
  for (let z = 0; z < depth; z++) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dz = z - depth / 2;
        const dy = y - center;
        const dx = x - center;
        // Check if point (x, y, z) is inside the simulated ellipsoid
        if ((dx*dx) / (radius*radius) + (dy*dy) / (radius*radius) + (dz*dz) / ((radius/2)*(radius/2)) < 1) {
          volume[z][y][x] = 1; // Mark as part of the segmented lesion
        }
      }
    }
  }
  return volume;
};


// --- Core Volume Renderer Component ---
const VolumeRenderer: React.FC<{ mode: '3D' | '4D' }> = ({ mode }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const volumeData = generate3DVolume(32, 64); // 32 slices, 64x64 resolution

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Simplified 2D projection/visualization of the 3D volume
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0f172a'; // Slate-900 background

    // Simple isometric projection rendering
    const sliceCount = volumeData.length;
    const sliceSize = volumeData[0].length;
    const scale = 3;
    
    // Draw slices (simulates the 3D look)
    for (let z = 0; z < sliceCount; z++) {
      const offset = z * 0.5 * scale;
      for (let y = 0; y < sliceSize; y++) {
        for (let x = 0; x < sliceSize; x++) {
          if (volumeData[z][y][x] === 1) {
            // Draw a bright pixel for the segmented lesion
            ctx.fillStyle = mode === '4D' ? `hsl(${z * 10}, 100%, 50%)` : '#3b82f6'; // Blue or rainbow for 4D flow
            ctx.fillRect(
              x * scale + offset, 
              y * scale - offset, 
              scale, 
              scale
            );
          }
        }
      }
    }
    
    // Simple 4D text overlay to denote dynamic change over time
    if (mode === '4D') {
      ctx.fillStyle = 'yellow';
      ctx.font = '14px sans-serif';
      ctx.fillText('Dynamic Flow Simulation (4D)', 10, 20);
    }
  }, [mode]);

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <h2 className="text-xl font-bold mb-3 text-gray-800">{mode} Lesion Reconstruction</h2>
      <canvas 
        ref={canvasRef} 
        width={300} 
        height={300} 
        className="border-2 border-indigo-500 shadow-xl rounded-lg bg-slate-900"
      />
      <p className="mt-4 text-sm text-gray-600">
        Rendering segmented volume using stacked 2D masks from the AI pipeline.
      </p>
    </div>
  );
};

export default VolumeRenderer;