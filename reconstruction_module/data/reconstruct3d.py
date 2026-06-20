import os
import numpy as np
from skimage import io, transform, measure
from stl import mesh

def reconstruct_ultrasound_3d(input_folder, output_path):
    files = sorted(os.listdir(input_folder))
    slices = []

    # Define a target size based on the first image
    first_image = io.imread(os.path.join(input_folder, files[0]), as_gray=True)
    target_shape = first_image.shape
    print(f"🩻 Using target image size: {target_shape}")

    for f in files:
        if not f.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp', '.tif')):
            continue

        img = io.imread(os.path.join(input_folder, f), as_gray=True)

        # Resize every image to the target size
        if img.shape != target_shape:
            img = transform.resize(img, target_shape, anti_aliasing=True)
            print(f"Resized {f} → {target_shape}")

        slices.append(img)

    if not slices:
        print("❌ No valid images found in the folder!")
        return

    # Stack into 3D volume
    volume = np.stack(slices)
    print(f"✅ 3D volume shape: {volume.shape}")

    # Create a 3D surface using marching cubes
    verts, faces, _, _ = measure.marching_cubes(volume, level=0.5)
    surface = mesh.Mesh(np.zeros(faces.shape[0], dtype=mesh.Mesh.dtype))
    for i, f in enumerate(faces):
        for j in range(3):
            surface.vectors[i][j] = verts[f[j], :]

    surface.save(output_path)
    print(f"💾 3D reconstruction saved to {output_path}")


if __name__ == "__main__":
    input_folder = "sample_ultrasound"  # Folder inside 'data'
    output_path = "output_model.stl"

    if not os.path.exists(input_folder):
        print(f"❌ Folder '{input_folder}' not found. Please add your images.")
    else:
        reconstruct_ultrasound_3d(input_folder, output_path)
