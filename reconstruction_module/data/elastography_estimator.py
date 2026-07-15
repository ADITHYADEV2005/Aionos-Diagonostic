import os
import argparse
import numpy as np
import cv2
import json

def simulate_elastography(image_path, mask_path=None, classification_path=None):
    """
    Simulates a clinical ultrasound shear-wave elastography scan by generating a color-coded
    tissue stiffness map (Blue = Soft/Normal, Green/Yellow = Intermediate, Red = Hard/Stiff).
    The stiffness pattern adapts dynamically based on model classification results.
    """
    img = cv2.imread(image_path)
    if img is None:
        raise FileNotFoundError(f"Input image not found: {image_path}")
        
    h, w, c = img.shape
    
    # 1. Load or compute liver mask
    if mask_path and os.path.exists(mask_path):
        mask = cv2.imread(mask_path, cv2.IMREAD_GRAYSCALE)
        if mask.shape != (h, w):
            mask = cv2.resize(mask, (w, h))
    else:
        mask = np.zeros((h, w), dtype=np.uint8)
        cv2.circle(mask, (w//2, h//2), min(h, w)//3, 255, -1)
        mask = cv2.GaussianBlur(mask, (31, 31), 0)
        
    # 2. Check classification to adapt stiffness profile
    diag_class = "Normal"
    if classification_path and os.path.exists(classification_path):
        try:
            with open(classification_path, "r") as f:
                diag_class = json.load(f).get("class", "Normal")
        except Exception:
            pass

    # 3. Build stiffness map values (0 to 255)
    # Start with a base noise representing background tissue density
    y_indices, x_indices = np.indices((h, w))
    # Soft background tissue noise
    stiffness_values = np.random.normal(60, 10, (h, w)) # Centered around blue (low values)
    
    # Generate abnormal stiffness peaks (nodules/tumors) if Benign or Malignant
    if diag_class == "Malignant":
        # Hard stiff nodule in center-right of liver
        cx, cy = int(w * 0.55), int(h * 0.5)
        r = min(h, w) // 5
        dist = np.sqrt((x_indices - cx)**2 + (y_indices - cy)**2)
        # Nodule has high stiffness (red, up to 240)
        nodule_stiffness = np.maximum(0, (r - dist) / r) * 180 + np.random.normal(0, 5, (h, w))
        stiffness_values = np.maximum(stiffness_values, nodule_stiffness + 50)
    elif diag_class == "Benign":
        # Moderately stiff, localized nodule (green/yellow, up to 140)
        cx, cy = int(w * 0.45), int(h * 0.55)
        r = min(h, w) // 6
        dist = np.sqrt((x_indices - cx)**2 + (y_indices - cy)**2)
        nodule_stiffness = np.maximum(0, (r - dist) / r) * 90 + np.random.normal(0, 5, (h, w))
        stiffness_values = np.maximum(stiffness_values, nodule_stiffness + 50)
        
    # Restrict to mask
    stiffness_values = np.clip(stiffness_values, 0, 255).astype(np.uint8)
    stiffness_values = cv2.bitwise_and(stiffness_values, mask)
    
    # Smooth the stiffness map to look like organic tissue
    stiffness_values = cv2.GaussianBlur(stiffness_values, (15, 15), 0)
    
    # 4. Convert stiffness values to a Jet colormap (Blue -> Green -> Yellow -> Red)
    elast_colormap = cv2.applyColorMap(stiffness_values, cv2.COLORMAP_JET)
    
    # Mask out non-liver pixels to black
    elast_colormap = cv2.bitwise_and(elast_colormap, cv2.merge([mask, mask, mask]))
    
    # 5. Blend elastogram with B-mode image for structural context
    # Usually, clinical elastography blends the color map over B-mode with ~40-50% transparency
    mask_f = mask / 255.0
    mask_f = np.expand_dims(mask_f, axis=-1)
    
    alpha = 0.45
    elast_img = img.copy()
    
    # Blend color within the mask
    inner_blend = cv2.addWeighted(img, 1.0 - alpha, elast_colormap, alpha, 0)
    # Apply mask boundary transition
    elast_img = (img * (1.0 - mask_f) + inner_blend * mask_f).astype(np.uint8)
    
    # 6. Draw an Elastography kPa Stiffness Scale Bar (Clinical Legend)
    scale_w, scale_h = 12, 100
    scale_x = w - 30
    scale_y = h - 140
    
    # Jet scale bar gradient
    scale_bar = np.zeros((scale_h, scale_w, 3), dtype=np.uint8)
    for y in range(scale_h):
        val = int(255 * (1.0 - y / scale_h))
        scale_bar[y, :] = cv2.applyColorMap(np.array([[val]], dtype=np.uint8), cv2.COLORMAP_JET)[0, 0]
        
    # Draw border
    cv2.rectangle(elast_img, (scale_x - 1, scale_y - 1), (scale_x + scale_w, scale_y + scale_h), (255, 255, 255), 1)
    # Insert bar
    elast_img[scale_y:scale_y+scale_h, scale_x:scale_x+scale_w] = scale_bar
    
    # Add labels (kPa markers based on diagnosis)
    font = cv2.FONT_HERSHEY_SIMPLEX
    max_kpa = "50 kPa" if diag_class == "Malignant" else "25 kPa" if diag_class == "Benign" else "12 kPa"
    cv2.putText(elast_img, max_kpa, (scale_x - 45, scale_y + 10), font, 0.32, (255, 255, 255), 1, cv2.LINE_AA)
    cv2.putText(elast_img, "0 kPa", (scale_x - 35, scale_y + scale_h - 2), font, 0.32, (255, 255, 255), 1, cv2.LINE_AA)
    
    # Calculate quantitative stiffness index in kPa
    mean_val = np.mean(stiffness_values[mask > 0]) if np.sum(mask > 0) > 0 else 0.0
    scale_factor = 50.0 / 255.0 if diag_class == "Malignant" else 25.0 / 255.0 if diag_class == "Benign" else 12.0 / 255.0
    stiffness_index = round(float(mean_val * scale_factor), 2)
    
    return elast_img, stiffness_index

def main():
    parser = argparse.ArgumentParser(description="Aionos Diagnostic - Generate Tissue Stiffness Elastography")
    parser.add_argument("--image", type=str, required=True, help="Path to input B-mode scan")
    parser.add_argument("--mask", type=str, default=None, help="Path to segmentation mask image")
    parser.add_argument("--class_meta", type=str, default=None, help="Path to classification.json metadata")
    parser.add_argument("--output_dir", type=str, default="output", help="Directory to save output files")
    args = parser.parse_args()

    os.makedirs(args.output_dir, exist_ok=True)

    print(f"📊 Running elastography estimation on: {args.image}...")
    try:
        elast_img, stiffness_idx = simulate_elastography(args.image, args.mask, args.class_meta)
        
        # Save output
        elast_output = os.path.join(args.output_dir, "elastography.png")
        cv2.imwrite(elast_output, elast_img)
        
        # Save stiffness metadata
        stiffness_meta = os.path.join(args.output_dir, "elastography.json")
        with open(stiffness_meta, "w") as f:
            json.dump({"stiffness_index": stiffness_idx}, f)
            
        print(f"✅ Elastogram saved: {elast_output}")
        print(f"✅ Stiffness Index: {stiffness_idx} kPa")
    except Exception as e:
        print(f"❌ Elastography simulation failed: {e}")

if __name__ == "__main__":
    main()
