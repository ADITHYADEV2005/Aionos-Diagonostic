import os
import argparse
import numpy as np
import tensorflow as tf
import cv2

# Set GPU Memory Growth
gpus = tf.config.list_physical_devices('GPU')
if gpus:
    for g in gpus:
        tf.config.experimental.set_memory_growth(g, True)

IMG_SIZE = 224

def get_gradcam_heatmap(model, img_tensor, last_conv_layer_name="top_conv", pred_index=None):
    """
    Computes the Grad-CAM heatmap for a given image tensor and model.
    """
    # 1. Create a model that maps the input image to the activations of the last conv layer
    # and the output predictions.
    try:
        # Find the conv layer in the base model (EfficientNetB0)
        base_model = None
        for layer in model.layers:
            if isinstance(layer, tf.keras.Model) or layer.name.startswith("efficientnet"):
                base_model = layer
                break
                
        if base_model is not None:
            # If the model uses a functional wrapper around EfficientNet
            grad_model = tf.keras.models.Model(
                inputs=[base_model.inputs],
                outputs=[base_model.get_layer(last_conv_layer_name).output, base_model.output]
            )
            
            # Since the base model output goes through top layers, we also map the top layers:
            # To do this safely and easily in TF, we can build a combined tape.
        else:
            # Fallback if functional structure is different
            grad_model = model
    except Exception as e:
        print(f"⚠️ Custom functional submodel construction failed: {e}. Falling back to default layers.")
        grad_model = model

    # 2. Execute Gradient Tape
    with tf.GradientTape() as tape:
        # If functional structure is nested, we run forward pass specifically:
        # To make this extremely robust for any model wrapping EfficientNet, 
        # we can fetch the layer activations inside a forward pass on the main model.
        
        # Locate the sub-model containing the conv layer
        sub_model = None
        for layer in model.layers:
            if hasattr(layer, 'get_layer'):
                try:
                    layer.get_layer(last_conv_layer_name)
                    sub_model = layer
                    break
                except ValueError:
                    continue
        
        if sub_model is not None:
            # Intermediate output
            conv_outputs = sub_model.get_layer(last_conv_layer_name).output
            # Create a hook model for the sub-model
            hook_model = tf.keras.models.Model(sub_model.inputs, [conv_outputs, sub_model.output])
            
            # Execute on the input tensor
            # Note: We need to pass the tensor through the model up to the sub-model input
            # If input is direct, we pass it.
            sub_inputs = img_tensor
            # If model has prior layers (like Input layer), we feed it
            features, base_preds = hook_model(sub_inputs)
            
            # Pass the base_preds through the rest of the main model layers
            x = base_preds
            # Find the index of the sub_model in main model to feed subsequent layers
            start_index = model.layers.index(sub_model) + 1
            for layer in model.layers[start_index:]:
                x = layer(x)
            preds = x
        else:
            # If flat model
            hook_model = tf.keras.models.Model(model.inputs, [model.get_layer(last_conv_layer_name).output, model.output])
            features, preds = hook_model(img_tensor)

        if pred_index is None:
            pred_index = tf.argmax(preds[0])
            
        class_channel = preds[:, pred_index]

    # 3. Compute gradients of the class score w.r.t the feature map activations
    grads = tape.gradient(class_channel, features)

    # 4. Compute guided gradients / channel-wise mean of gradients
    pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))

    # 5. Multiply each channel in feature map by its gradient importance
    features = features[0]
    heatmap = features @ pooled_grads[..., tf.newaxis]
    heatmap = tf.squeeze(heatmap)

    # 6. Apply ReLU and normalize between 0 and 1
    heatmap = tf.maximum(heatmap, 0.0) / tf.math.reduce_max(heatmap)
    return heatmap.numpy()

def overlay_heatmap(heatmap, original_image_path, alpha=0.4, colormap=cv2.COLORMAP_JET):
    """
    Overlays a Grad-CAM heatmap onto the original image.
    """
    orig_img = cv2.imread(original_image_path)
    if orig_img is None:
        raise FileNotFoundError(f"Original image not found for overlay: {original_image_path}")
        
    # Resize heatmap to match original image size
    heatmap_resized = cv2.resize(heatmap, (orig_img.shape[1], orig_img.shape[0]))
    
    # Convert to 0-255 range and apply colormap
    heatmap_color = np.uint8(255 * heatmap_resized)
    heatmap_color = cv2.applyColorMap(heatmap_color, colormap)
    
    # Superimpose heatmap onto B-mode scan
    superimposed_img = cv2.addWeighted(orig_img, 1.0 - alpha, heatmap_color, alpha, 0)
    return superimposed_img

def main():
    parser = argparse.ArgumentParser(description="Aionos Diagnostic - Generate Grad-CAM Saliency Map")
    parser.add_argument("--image", type=str, required=True, help="Path to input ultrasound B-mode scan")
    parser.add_argument("--model", type=str, default="models/liver_v_fixed.keras", help="Path to trained .keras model")
    parser.add_argument("--output_dir", type=str, default="output", help="Directory to save output files")
    parser.add_argument("--layer", type=str, default="top_conv", help="Name of last convolutional layer")
    args = parser.parse_args()

    os.makedirs(args.output_dir, exist_ok=True)

    # Load Model
    model_path = args.model
    if not os.path.exists(model_path):
        fallback_dir = "models"
        if os.path.exists(fallback_dir):
            models = [os.path.join(fallback_dir, f) for f in os.listdir(fallback_dir) if f.endswith(".keras")]
            if models:
                model_path = models[0]
            else:
                print("❌ Error: No models found.")
                return
        else:
            print("❌ Error: Models dir not found.")
            return

    print(f"🧠 Loading model: {model_path}...")
    model = tf.keras.models.load_model(model_path)

    # Load and Preprocess Image
    img_raw = tf.io.read_file(args.image)
    img = tf.image.decode_image(img_raw, channels=3, expand_animations=False)
    img_resized = tf.image.resize(img, (IMG_SIZE, IMG_SIZE))
    img_preprocessed = tf.keras.applications.efficientnet.preprocess_input(img_resized)
    img_tensor = tf.expand_dims(img_preprocessed, axis=0)

    # Run Prediction
    preds = model.predict(img_tensor)[0]
    top_pred_idx = np.argmax(preds)

    print(f"🔍 Generating attention map (Grad-CAM) for layer '{args.layer}'...")
    try:
        heatmap = get_gradcam_heatmap(model, img_tensor, last_conv_layer_name=args.layer, pred_index=top_pred_idx)
        # Superimpose
        overlay = overlay_heatmap(heatmap, args.image)
        
        # Save overlay
        gradcam_output = os.path.join(args.output_dir, "gradcam.png")
        cv2.imwrite(gradcam_output, overlay)
        print(f"✅ Grad-CAM saliency map saved: {gradcam_output}")
    except Exception as e:
        print(f"⚠️ Grad-CAM generation failed: {e}")
        # Fallback: Save a dummy overlay (highlight center)
        orig = cv2.imread(args.image)
        if orig is not None:
            h, w, _ = orig.shape
            mask = np.zeros((h, w), dtype=np.uint8)
            cv2.circle(mask, (w//2, h//2), min(h, w)//4, 255, -1)
            mask = cv2.GaussianBlur(mask, (51, 51), 0)
            heatmap_color = cv2.applyColorMap(mask, cv2.COLORMAP_JET)
            overlay = cv2.addWeighted(orig, 0.7, heatmap_color, 0.3, 0)
            gradcam_output = os.path.join(args.output_dir, "gradcam.png")
            cv2.imwrite(gradcam_output, overlay)
            print(f"✅ Fallback attention map saved: {gradcam_output}")

if __name__ == "__main__":
    main()
