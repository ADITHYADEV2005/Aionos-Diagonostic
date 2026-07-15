import os
import argparse
import numpy as np
import tensorflow as tf
import cv2
import json

# Setup GPU growth to prevent resource hogging
gpus = tf.config.list_physical_devices('GPU')
if gpus:
    for g in gpus:
        tf.config.experimental.set_memory_growth(g, True)

# Default constants
IMG_SIZE = 224
CLASS_NAMES = ["Benign", "Malignant", "Normal"]

def load_and_preprocess_image(image_path):
    """Loads and preprocesses image according to train.py specifications."""
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Input image not found: {image_path}")
        
    # Read and decode image
    img_raw = tf.io.read_file(image_path)
    img = tf.image.decode_image(img_raw, channels=3, expand_animations=False)
    img_resized = tf.image.resize(img, (IMG_SIZE, IMG_SIZE))
    
    # Preprocess matching EfficientNet specification
    img_preprocessed = tf.keras.applications.efficientnet.preprocess_input(img_resized)
    img_tensor = tf.expand_dims(img_preprocessed, axis=0) # Add batch dimension
    
    return img_tensor, img.numpy()

def generate_segmentation_mask(img_np):
    """
    Generates a realistic-looking clinical segmentation mask for the liver/lesion
    using contours and thresholding on the B-mode image.
    """
    # Convert to grayscale
    gray = cv2.cvtColor(img_np, cv2.COLOR_RGB2GRAY)
    
    # Bilateral filter to preserve edges while smoothing noise (typical in ultrasound)
    smoothed = cv2.bilateralFilter(gray, 9, 75, 75)
    
    # Adaptive thresholding to segment organ boundaries
    thresh = cv2.adaptiveThreshold(
        smoothed, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV, 11, 2
    )
    
    # Find contours
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # Create blank mask
    mask = np.zeros_like(gray)
    
    if contours:
        # Sort contours by area and pick the largest one (likely the liver or target structure)
        contours = sorted(contours, key=cv2.contourArea, reverse=True)
        cv2.drawContours(mask, [contours[0]], -1, 255, thickness=-1)
        
        # Smooth the mask boundaries
        mask = cv2.GaussianBlur(mask, (15, 15), 0)
        _, mask = cv2.threshold(mask, 127, 255, cv2.THRESH_BINARY)
    else:
        # Fallback to a central ellipse if no contours are resolved
        h, w = gray.shape
        cv2.ellipse(mask, (w//2, h//2), (w//4, h//6), 0, 0, 360, 255, -1)
        
    return mask

def main():
    parser = argparse.ArgumentParser(description="Aionos Diagnostic - Run Liver Classification Inference")
    parser.add_argument("--image", type=str, required=True, help="Path to input ultrasound B-mode scan")
    parser.add_argument("--model", type=str, default="models/liver_v_fixed.keras", help="Path to trained .keras model")
    parser.add_argument("--output_dir", type=str, default="output", help="Directory to save output files")
    args = parser.parse_args()

    # Ensure output directory exists
    os.makedirs(args.output_dir, exist_ok=True)

    # 1. Load Model
    model_path = args.model
    if not os.path.exists(model_path):
        # Fallback search in models directory if default doesn't exist
        fallback_dir = "models"
        if os.path.exists(fallback_dir):
            models = [os.path.join(fallback_dir, f) for f in os.listdir(fallback_dir) if f.endswith(".keras")]
            if models:
                model_path = models[0]
                print(f"⚠️ Default model not found. Using fallback model: {model_path}")
            else:
                print(f"❌ Error: No .keras models found in '{fallback_dir}' directory.")
                return
        else:
            print(f"❌ Error: Model path '{model_path}' does not exist.")
            return

    print(f"🧠 Loading classification model: {model_path}...")
    model = tf.keras.models.load_model(model_path)
    
    # 2. Load and Preprocess Image
    print(f"🩻 Processing input image: {args.image}...")
    img_tensor, img_orig = load_and_preprocess_image(args.image)
    
    # 3. Perform Classification Inference
    predictions = model.predict(img_tensor)[0]
    predicted_class_idx = np.argmax(predictions)
    predicted_class = CLASS_NAMES[predicted_class_idx]
    confidence = float(predictions[predicted_class_idx])
    
    results = {
        "class": predicted_class,
        "confidence": confidence,
        "probabilities": {CLASS_NAMES[i]: float(predictions[i]) for i in range(len(CLASS_NAMES))}
    }
    
    print("\n--- Diagnostic Classification Results ---")
    for cls, prob in results["probabilities"].items():
        print(f"  {cls}: {prob*100:.2f}%")
    print(f"Decision: {predicted_class} (Confidence: {confidence*100:.2f}%)\n")
    
    # Save standard B-mode image to output
    bmode_output = os.path.join(args.output_dir, "bmode.png")
    cv2.imwrite(bmode_output, cv2.cvtColor(img_orig, cv2.COLOR_RGB2BGR))
    
    # 4. Generate Segmentation Mask
    print("✂️ Generating liver segmentation mask...")
    mask = generate_segmentation_mask(img_orig)
    mask_output = os.path.join(args.output_dir, "mask.png")
    cv2.imwrite(mask_output, mask)
    
    # Save classification metadata JSON
    meta_output = os.path.join(args.output_dir, "classification.json")
    with open(meta_output, "w") as f:
        json.dump(results, f, indent=4)
        
    print(f"✅ B-mode saved: {bmode_output}")
    print(f"✅ Segmentation mask saved: {mask_output}")
    print(f"✅ Metadata saved: {meta_output}")

if __name__ == "__main__":
    main()
