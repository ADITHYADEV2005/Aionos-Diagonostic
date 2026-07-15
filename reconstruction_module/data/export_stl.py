import os
import argparse
import shutil
import numpy as np
from reconstruct3d import reconstruct_ultrasound_3d

# Define paths
DEFAULT_INPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sample_ultrasound")
DEFAULT_OUTPUT_STL = os.path.join(os.path.dirname(os.path.abspath(__file__)), "output_model.stl")

# React app public directory target (relative mapping)
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DEFAULT_REACT_PUBLIC = os.path.join(PROJECT_ROOT, "public", "output_model.stl")

def main():
    parser = argparse.ArgumentParser(description="Aionos Diagnostic - 3D Volume Reconstruction & STL Exporter")
    parser.add_argument("--input_dir", type=str, default=DEFAULT_INPUT_DIR, help="Directory containing ultrasound slices")
    parser.add_argument("--output_path", type=str, default=DEFAULT_OUTPUT_STL, help="Path to save output .stl locally")
    parser.add_argument("--react_public", type=str, default=DEFAULT_REACT_PUBLIC, help="Path to copy .stl in React public directory")
    args = parser.parse_args()

    print("============================================================")
    print("🧊 AIONOS 3D VOLUMETRIC RECONSTRUCTION & EXPORTER")
    print("============================================================")

    # 1. Verify input directory
    if not os.path.exists(args.input_dir):
        print(f"❌ Input folder '{args.input_dir}' not found. Please specify a valid folder containing images.")
        return

    # 2. Run 3D Volume Reconstruction (Marching Cubes)
    print(f"🔄 Reconstructing slices from: {args.input_dir}...")
    try:
        reconstruct_ultrasound_3d(args.input_dir, args.output_path)
    except Exception as e:
        print(f"❌ 3D Reconstruction failed: {e}")
        return

    # 3. Verify output mesh was successfully written
    if not os.path.exists(args.output_path):
        print(f"❌ Reconstruction failed to write STL file: {args.output_path}")
        return

    # 4. Copy to React public directory for visualization
    print(f"📋 Copying generated model to React app public folder...")
    try:
        # Create destination directory if it doesn't exist (e.g. public/)
        dest_dir = os.path.dirname(args.react_public)
        os.makedirs(dest_dir, exist_ok=True)
        
        shutil.copy(args.output_path, args.react_public)
        print(f"✅ Copied successfully to: {args.react_public}")
        print("🎉 3D model is now ready to be loaded by the React Three.js / ThreeDCanvas viewer.")
    except Exception as e:
        print(f"⚠️ Failed to copy STL to public folder: {e}")
        print(f"Please copy the file manually from: {args.output_path} to your React project public/ folder.")

if __name__ == "__main__":
    main()
