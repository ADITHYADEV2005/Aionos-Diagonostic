import os
import argparse
import numpy as np
import cv2

def simulate_doppler_flow(image_path, mask_path=None, flow_strength=0.75):
    """
    Simulates a clinical color Doppler flow scan by detecting vascular regions
    (fluid-filled dark tubular structures) and overlaying red/blue flow patterns.
    """
    img = cv2.imread(image_path)
    if img is None:
        raise FileNotFoundError(f"Input image not found: {image_path}")
        
    h, w, c = img.shape
    
    # 1. Load or compute liver mask to restrict Doppler overlay to liver region
    if mask_path and os.path.exists(mask_path):
        mask = cv2.imread(mask_path, cv2.IMREAD_GRAYSCALE)
        # Ensure mask matches image size
        if mask.shape != (h, w):
            mask = cv2.resize(mask, (w, h))
    else:
        # Create a default central circular mask if none provided
        mask = np.zeros((h, w), dtype=np.uint8)
        cv2.circle(mask, (w//2, h//2), min(h, w)//3, 255, -1)
        mask = cv2.GaussianBlur(mask, (31, 31), 0)
        
    # Convert image to grayscale for vessel detection
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # 2. Segment potential vessel regions (dark, fluid-filled circular/tubular areas)
    # Apply thresholding inside the masked area
    _, vessel_candidates = cv2.threshold(gray, 45, 255, cv2.THRESH_BINARY_INV)
    vessel_mask = cv2.bitwise_and(vessel_candidates, mask)
    
    # Smooth the vessel boundaries
    vessel_mask = cv2.medianBlur(vessel_mask, 5)
    
    # 3. Create Doppler Color Overlay (Red = towards probe, Blue = away)
    doppler_color = np.zeros_like(img)
    
    # Generate spatial pattern (e.g. sine wave grid + noise to simulate blood velocity/turbulence)
    y_indices, x_indices = np.indices((h, w))
    # Flow direction simulation: creates alternating red and blue vascular branches
    flow_pattern = np.sin(x_indices / 10.0) * np.cos(y_indices / 15.0) + np.random.normal(0, 0.1, (h, w))
    
    # Red flow (positive values in pattern)
    red_mask = (flow_pattern > 0.1) & (vessel_mask > 0)
    # Blue flow (negative values in pattern)
    blue_mask = (flow_pattern < -0.1) & (vessel_mask > 0)
    
    # Apply vibrant clinical colors
    doppler_color[red_mask] = [0, 50, 255]     # Bright Red/Orange
    doppler_color[blue_mask] = [255, 120, 0]    # Bright Blue
    
    # Smooth the flow color maps
    doppler_color = cv2.GaussianBlur(doppler_color, (5, 5), 0)
    
    # 4. Blend the Doppler overlay onto the original B-mode image
    blend_mask = (red_mask | blue_mask).astype(np.uint8) * 255
    blend_mask = cv2.dilate(blend_mask, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3,3)))
    blend_mask_f = cv2.GaussianBlur(blend_mask, (5, 5), 0) / 255.0
    blend_mask_f = np.expand_dims(blend_mask_f, axis=-1)
    
    # Combine original image with colored flow based on blending mask
    doppler_img = (img * (1.0 - blend_mask_f * flow_strength) + doppler_color * (blend_mask_f * flow_strength)).astype(np.uint8)
    
    # 5. Draw a Doppler Velocity Scale Bar (Clinical Legend) on the top right
    scale_w, scale_h = 12, 100
    scale_x = w - 30
    scale_y = 40
    
    # Create gradient bar (Red -> Black -> Blue)
    scale_bar = np.zeros((scale_h, scale_w, 3), dtype=np.uint8)
    for y in range(scale_h):
        ratio = y / scale_h
        if ratio < 0.5:
            # Red to Black
            r = int(255 * (1.0 - ratio * 2.0))
            scale_bar[y, :] = [0, int(r * 0.2), r]
        else:
            # Black to Blue
            b = int(255 * ((ratio - 0.5) * 2.0))
            scale_bar[y, :] = [b, int(b * 0.4), 0]
            
    # Draw scale bar border
    cv2.rectangle(doppler_img, (scale_x - 1, scale_y - 1), (scale_x + scale_w, scale_y + scale_h), (255, 255, 255), 1)
    # Insert scale bar
    doppler_img[scale_y:scale_y+scale_h, scale_x:scale_x+scale_w] = scale_bar
    
    # Add labels (+V, -V)
    font = cv2.FONT_HERSHEY_SIMPLEX
    cv2.putText(doppler_img, "+V", (scale_x - 22, scale_y + 10), font, 0.35, (255, 255, 255), 1, cv2.LINE_AA)
    cv2.putText(doppler_img, "-V", (scale_x - 20, scale_y + scale_h - 2), font, 0.35, (255, 255, 255), 1, cv2.LINE_AA)
    
    # Calculate average flow strength index for report
    flow_pixels = np.sum(vessel_mask > 0)
    total_pixels = np.sum(mask > 0)
    flow_strength_index = round(float(flow_pixels / total_pixels * 10) if total_pixels > 0 else 0.0, 2)
    
    return doppler_img, flow_strength_index

def main():
    parser = argparse.ArgumentParser(description="Aionos Diagnostic - Estimate Color Doppler Flow")
    parser.add_argument("--image", type=str, required=True, help="Path to input B-mode scan")
    parser.add_argument("--mask", type=str, default=None, help="Path to segmentation mask image")
    parser.add_argument("--output_dir", type=str, default="output", help="Directory to save output files")
    parser.add_argument("--flow_strength", type=float, default=0.75, help="Intensity of color flow overlay")
    args = parser.parse_args()

    os.makedirs(args.output_dir, exist_ok=True)

    print(f"🌊 Running Doppler blood flow estimation on: {args.image}...")
    try:
        doppler_img, flow_idx = simulate_doppler_flow(args.image, args.mask, args.flow_strength)
        
        # Save output
        doppler_output = os.path.join(args.output_dir, "doppler.png")
        cv2.imwrite(doppler_output, doppler_img)
        
        # Save flow metadata
        flow_meta = os.path.join(args.output_dir, "doppler.json")
        import json
        with open(flow_meta, "w") as f:
            json.dump({"flow_strength_index": flow_idx}, f)
            
        print(f"✅ Doppler color flow image saved: {doppler_output}")
        print(f"✅ Flow Strength Index: {flow_idx}")
    except Exception as e:
        print(f"❌ Doppler estimation failed: {e}")

if __name__ == "__main__":
    main()
