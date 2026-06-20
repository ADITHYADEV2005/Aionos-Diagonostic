import pyvista as pv
import os
import shutil

# --- CRITICAL FIX START ---
# 1. Define the source path: Assuming 'reconstruct3d.py' saves to the same folder
#    as this script (C:\Users\adith\OneDrive\Desktop\flow-my-app-main\reconstruction_module\data\)
SOURCE_DIR = os.path.dirname(os.path.abspath(__file__))
SOURCE_STL_PATH = os.path.join(SOURCE_DIR, "output_model.stl")

# 2. Define the absolute destination path in the React public folder.
#    This path is correct for your setup.
REACT_PUBLIC_PATH = r"C:\Users\adith\OneDrive\ドキュメント\Desktop\flow-my-app-main\public\output_model.stl"
# --- CRITICAL FIX END ---

# Check if the source STL file exists
if not os.path.exists(SOURCE_STL_PATH):
    # Check if the target file exists in the React folder (as a fallback)
    if os.path.exists(REACT_PUBLIC_PATH):
        print("⚠️ Source STL file not found, but a previous version exists in the React public folder.")
    else:
        print("❌ CRITICAL: Source STL file not found! Please run 'reconstruct3d.py' first.")
        exit()
else:
    # Copy STL file to React public folder
    try:
        shutil.copy(SOURCE_STL_PATH, REACT_PUBLIC_PATH)
        print(f"✅ Copied '{os.path.basename(SOURCE_STL_PATH)}' to React public folder.")
    except Exception as e:
        print(f"⚠️ Failed to copy file. Check permissions: {e}")
        exit()

# --- PyVista Visualization (Runs only if file is confirmed to exist) ---

# Load the file from the final destination path to confirm integrity
mesh = pv.read(REACT_PUBLIC_PATH)

# Create an interactive PyVista viewer (optional)
plotter = pv.Plotter()
plotter.add_mesh(mesh, color="#3b82f6", smooth_shading=True, opacity=1.0) # Using the React viewer color
plotter.add_axes()
plotter.show_grid()
plotter.enable_eye_dome_lighting()
plotter.background_color = "white"

# Print details
num_points = mesh.n_points
num_cells = mesh.n_cells

print("✅ Model successfully processed and ready for React viewer.")
print(f"Mesh contains {num_points} points and {num_cells} cells (faces).")

# Show model in PyVista
plotter.show(title="Ultrasound 3D Reconstruction")

