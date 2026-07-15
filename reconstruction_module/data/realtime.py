import os
import argparse
import time
import subprocess
import json

def run_pipeline(image_path, model_path, output_dir):
    """
    Orchestrates the execution of the entire AI Diagnostics pipeline sequentially,
    capturing processing times and outputting status updates.
    """
    start_time = time.time()
    print("============================================================")
    print("🚀 AIONOS LIVER DIAGNOSTICS - RUNNING FULL PIPELINE")
    print("============================================================")

    import sys
    python_bin = sys.executable

    # Ensure output directory exists
    os.makedirs(output_dir, exist_ok=True)
    
    # 1. Step 1: Inference & Mask Generation
    print("\n[STEP 1/5] Classification & Segmentation Mask...")
    inf_args = [python_bin, "reconstruction_module/data/inference.py", "--image", image_path, "--output_dir", output_dir]
    if model_path:
        inf_args.extend(["--model", model_path])
    res = subprocess.run(inf_args, capture_output=True, text=True)
    print(res.stdout)
    if res.returncode != 0:
        print(f"❌ Inference failed: {res.stderr}")
        return False

    # 2. Step 2: Grad-CAM Saliency Map
    print("\n[STEP 2/5] Grad-CAM Saliency Map...")
    gcam_args = [python_bin, "reconstruction_module/data/gradcam.py", "--image", image_path, "--output_dir", output_dir]
    if model_path:
        gcam_args.extend(["--model", model_path])
    res = subprocess.run(gcam_args, capture_output=True, text=True)
    print(res.stdout)

    # 3. Step 3: Doppler Flow Estimation
    print("\n[STEP 3/5] Doppler Flow Estimation...")
    mask_path = os.path.join(output_dir, "mask.png")
    dop_args = [python_bin, "reconstruction_module/data/doppler_estimator.py", "--image", image_path, "--mask", mask_path, "--output_dir", output_dir]
    res = subprocess.run(dop_args, capture_output=True, text=True)
    print(res.stdout)

    # 4. Step 4: Elastography Stiffness Map
    print("\n[STEP 4/5] Elastography Stiffness Map...")
    class_meta = os.path.join(output_dir, "classification.json")
    elast_args = [python_bin, "reconstruction_module/data/elastography_estimator.py", "--image", image_path, "--mask", mask_path, "--class_meta", class_meta, "--output_dir", output_dir]
    res = subprocess.run(elast_args, capture_output=True, text=True)
    print(res.stdout)

    # 5. Step 5: Compile Report
    print("\n[STEP 5/5] Compiling Diagnostic Report...")
    elapsed_ms = int((time.time() - start_time) * 1000)
    rep_args = [python_bin, "reconstruction_module/data/report_generator.py", "--output_dir", output_dir, "--time_ms", str(elapsed_ms)]
    res = subprocess.run(rep_args, capture_output=True, text=True)
    print(res.stdout)

    print("============================================================")
    print(f"✅ PIPELINE COMPLETED SUCCESSFULLY IN {elapsed_ms} ms")
    print("============================================================")
    return True

def main():
    parser = argparse.ArgumentParser(description="Aionos Real-time Pipeline Orchestrator")
    parser.add_argument("--image", type=str, help="Path to single B-mode image to process")
    parser.add_argument("--model", type=str, default=None, help="Path to classification model")
    parser.add_argument("--output_dir", type=str, default="output", help="Directory for output files")
    parser.add_argument("--monitor_dir", type=str, default=None, help="Directory to monitor for incoming scans (Real-time mode)")
    args = parser.parse_args()

    if args.image:
        # Run pipeline once on specified image
        run_pipeline(args.image, args.model, args.output_dir)
    elif args.monitor_dir:
        # Run in monitoring loop mode (checks directory every 2 seconds for new files)
        print(f"👀 Monitoring directory for new scans: {args.monitor_dir}")
        os.makedirs(args.monitor_dir, exist_ok=True)
        processed_files = set()
        
        try:
            while True:
                for f in os.listdir(args.monitor_dir):
                    if f.lower().endswith((".png", ".jpg", ".jpeg")) and f not in processed_files:
                        file_path = os.path.join(args.monitor_dir, f)
                        print(f"\n🔔 New scan detected: {file_path}")
                        # Wait a split second to make sure file write is complete
                        time.sleep(0.5)
                        
                        # Process image
                        run_pipeline(file_path, args.model, args.output_dir)
                        processed_files.add(f)
                time.sleep(2)
        except KeyboardInterrupt:
            print("\n👋 Stopping real-time monitoring.")
    else:
        # Fallback to run a default check on sample image
        sample_img = "reconstruction_module/data/sample_ultrasound/image_1853804792340-10_10_1.png"
        if os.path.exists(sample_img):
            run_pipeline(sample_img, args.model, args.output_dir)
        else:
            print("❌ No image, directory, or default sample image was found. Run with --help for details.")

if __name__ == "__main__":
    main()
