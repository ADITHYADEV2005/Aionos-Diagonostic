"""
Aionos Diagnostic - Hardware Interface & Ultrasound DSP Signal Processing Module
Handles Serial Communication with RP2040 MCU, A-Scan to B-Scan Conversion,
Synthetic Hardware Simulator, and Real-Time Multi-Modal Data Generation.
"""

import time
import json
import threading
import math
import numpy as np
try:
    from scipy.signal import butter, filtfilt, hilbert
    SCIPY_AVAILABLE = True
except Exception:
    SCIPY_AVAILABLE = False

try:
    import serial
    import serial.tools.list_ports
    SERIAL_AVAILABLE = True
except ImportError:
    SERIAL_AVAILABLE = False

# ─── 1. A-Scan Signal Processing Pipeline ─────────────────────────────────────

def butterworth_bandpass_filter(rf_data, fs=2.0e6, lowcut=100.0e3, highcut=800.0e3, order=4):
    """
    Applies a digital bandpass filter to raw A-scan RF voltage samples.
    Uses SciPy if available, otherwise NumPy moving average smoother.
    """
    rf_data = np.asarray(rf_data, dtype=np.float32)
    if SCIPY_AVAILABLE:
        nyquist = 0.5 * fs
        low = max(0.01, lowcut / nyquist)
        high = min(0.99, highcut / nyquist)
        try:
            b, a = butter(order, [low, high], btype='band')
            filtered = filtfilt(b, a, rf_data)
            return filtered
        except Exception:
            pass
            
    # NumPy Moving Average Smoothing Fallback
    window = 5
    kernel = np.ones(window) / window
    smoothed = np.convolve(rf_data, kernel, mode='same')
    return smoothed - np.mean(rf_data)

def hilbert_envelope_detection(rf_signal):
    """
    Performs envelope detection to extract returning acoustic echo amplitude.
    Uses SciPy Hilbert if available, otherwise NumPy peak magnitude envelope.
    """
    rf_signal = np.asarray(rf_signal, dtype=np.float32)
    if SCIPY_AVAILABLE:
        try:
            analytic_signal = hilbert(rf_signal)
            amplitude_envelope = np.abs(analytic_signal)
            return amplitude_envelope
        except Exception:
            pass
            
    # NumPy Peak Magnitude Envelope Fallback
    rectified = np.abs(rf_signal)
    kernel = np.ones(7) / 7.0
    envelope = np.convolve(rectified, kernel, mode='same')
    return envelope

def apply_time_gain_compensation(envelope, alpha=0.015):
    """
    Applies Time-Gain Compensation (TGC) exponential amplification across depth
    to compensate for acoustic energy attenuation in deeper biological tissues.
    """
    depth_samples = len(envelope)
    depth_indices = np.arange(depth_samples, dtype=np.float32)
    tgc_curve = np.exp(alpha * depth_indices)
    compensated = envelope * tgc_curve
    return compensated

def log_compress(tgc_envelope, dynamic_range_db=50.0):
    """
    Compresses dynamic range to standard 8-bit scale (0 to 255):
    I_compressed = 20 * log10(|A| + 1)
    """
    envelope_norm = np.clip(tgc_envelope, 0, None)
    log_data = 20.0 * np.log10(envelope_norm + 1.0)
    
    max_val = np.max(log_data)
    if max_val > 0:
        compressed_8bit = (log_data / max_val) * 255.0
    else:
        compressed_8bit = log_data
        
    return np.clip(compressed_8bit, 0, 255).astype(np.uint8)

def polar_to_cartesian_scan_convert(radial_lines_dict, grid_size=512, max_radius_px=220):
    """
    Scan Converter: Maps fan-shaped radial line data (Angles 0° to 180°, Depths 0 to R)
    onto a rectangular Cartesian grid (512x512 NumPy matrix).
    """
    cartesian_grid = np.zeros((grid_size, grid_size), dtype=np.uint8)
    center_x = grid_size // 2
    center_y = grid_size // 10  # Apex near top center
    
    if not radial_lines_dict:
        return cartesian_grid

    angles = sorted(radial_lines_dict.keys())
    
    # Pre-build coordinates
    for angle_deg in angles:
        line_samples = radial_lines_dict[angle_deg]
        num_samples = len(line_samples)
        if num_samples == 0:
            continue
            
        # Convert transducer angle: 0° is left, 90° is straight down, 180° is right
        angle_rad = math.radians(angle_deg - 90)
        
        r_indices = np.linspace(0, max_radius_px, num_samples)
        
        x_coords = (center_x + r_indices * math.sin(angle_rad)).astype(np.int32)
        y_coords = (center_y + r_indices * math.cos(angle_rad)).astype(np.int32)
        
        valid_mask = (x_coords >= 0) & (x_coords < grid_size) & (y_coords >= 0) & (y_coords < grid_size)
        
        x_valid = x_coords[valid_mask]
        y_valid = y_coords[valid_mask]
        vals_valid = line_samples[valid_mask]
        
        cartesian_grid[y_valid, x_valid] = vals_valid
        
    # Apply light Gaussian smoothing to fill radial sector gaps
    cartesian_grid = cv2.GaussianBlur(cartesian_grid, (3, 3), 0)
    return cartesian_grid

# ─── 2. Synthetic Ultrasound Hardware Simulator ──────────────────────────────

class MockUltrasoundHardware:
    """
    Simulates a physical RP2040 transducer scanner when physical hardware is disconnected.
    Generates realistic A-scan RF echo lines with anatomical liver tissue layers,
    lesion acoustic boundaries, and a continuous 0°-180° sweep motion.
    """
    def __init__(self):
        self.angle = 0
        self.direction = 1
        self.samples_per_line = 384
        self.running = False
        
    def generate_ascan_line(self, angle_deg):
        """
        Generates synthetic RF A-scan voltage line for given transducer angle.
        """
        depths = np.linspace(0, 1, self.samples_per_line)
        
        # Base speckle tissue noise
        rf_signal = np.random.normal(0, 15, self.samples_per_line)
        
        # Skin surface reflection echo (depth 0.05)
        rf_signal += 180.0 * np.exp(-((depths - 0.05)**2) / 0.0005) * np.sin(2 * np.pi * 12 * depths)
        
        # Liver capsule anatomical boundary (depth 0.25)
        rf_signal += 140.0 * np.exp(-((depths - 0.25)**2) / 0.001) * np.sin(2 * np.pi * 15 * depths)
        
        # Simulated focal lesion / blockage (centered around angle 90°, depth 0.55)
        angle_distance = abs(angle_deg - 90)
        if angle_distance < 35:
            lesion_strength = (35 - angle_distance) / 35.0
            rf_signal += 210.0 * lesion_strength * np.exp(-((depths - 0.55)**2) / 0.003) * np.sin(2 * np.pi * 18 * depths)
            rf_signal += 110.0 * lesion_strength * np.exp(-((depths - 0.68)**2) / 0.002) * np.sin(2 * np.pi * 16 * depths)
            
        # Diaphragm posterior boundary (depth 0.85)
        rf_signal += 160.0 * np.exp(-((depths - 0.85)**2) / 0.0015) * np.sin(2 * np.pi * 14 * depths)
        
        # Time Gain Compensation attenuation offset
        rf_signal *= np.exp(-0.8 * depths)
        
        # Scale to 12-bit ADC reading (0 to 4095)
        rf_signal = np.clip(rf_signal + 120, 0, 4095)
        return rf_signal.astype(np.int32).tolist()
        
    def step_sweep(self):
        """
        Advances the simulated motor sweep by 1 step (0 to 180 deg).
        """
        current = self.angle
        self.angle += self.direction * 2
        if self.angle >= 180:
            self.angle = 180
            self.direction = -1
        elif self.angle <= 0:
            self.angle = 0
            self.direction = 1
            
        line_samples = self.generate_ascan_line(current)
        return current, line_samples

# ─── 3. Hardware Manager & Serial Handler ───────────────────────────────────

class HardwareManager:
    """
    Manages serial connection to RP2040 MCU, A-scan line buffers, DSP processing,
    and Mock Hardware Simulator fallback mode.
    """
    def __init__(self):
        self.port = None
        self.baudrate = 115200
        self.serial_conn = None
        self.is_connected = False
        self.is_simulator = False
        self.is_scanning = False
        
        self.mock_hw = MockUltrasoundHardware()
        self.radial_lines = {}  # {angle_deg: processed_8bit_line}
        self.raw_ascan_lines = {} # {angle_deg: raw_adc_samples}
        
        self.current_angle = 90
        self.active_ascan_samples = []
        self.frame_count = 0
        
        self._thread = None
        self._stop_event = threading.Event()
        self._lock = threading.Lock()

    def get_available_ports(self):
        """
        Returns list of available serial/COM ports.
        """
        ports_info = []
        if SERIAL_AVAILABLE:
            try:
                for p in serial.tools.list_ports.comports():
                    ports_info.append({
                        "port": p.device,
                        "description": p.description,
                        "hwid": p.hwid
                    })
            except Exception:
                pass
        return ports_info

    def connect(self, port_name="SIMULATOR", baudrate=115200):
        """
        Connects to a serial COM port or starts Mock Simulator mode.
        """
        self.disconnect()
        
        if port_name.upper() in ["SIMULATOR", "MOCK", "DEMO"] or not SERIAL_AVAILABLE:
            print("[HardwareManager] Starting Mock Ultrasound Hardware Simulator Mode")
            self.is_connected = True
            self.is_simulator = True
            self.port = "SIMULATOR"
            self.is_scanning = True
            self._start_reader_thread()
            return {"status": "connected", "mode": "simulator", "port": "SIMULATOR"}
            
        try:
            self.serial_conn = serial.Serial(port_name, baudrate, timeout=1.0)
            time.sleep(0.5)
            self.serial_conn.write(b"START\n")
            
            self.is_connected = True
            self.is_simulator = False
            self.port = port_name
            self.baudrate = baudrate
            self.is_scanning = True
            
            self._start_reader_thread()
            print(f"[HardwareManager] Connected to physical MCU on port {port_name}")
            return {"status": "connected", "mode": "physical", "port": port_name}
        except Exception as e:
            print(f"[HardwareManager Warning] Serial connection failed ({e}). Falling back to Simulator.")
            self.is_connected = True
            self.is_simulator = True
            self.port = "SIMULATOR (Fallback)"
            self.is_scanning = True
            self._start_reader_thread()
            return {"status": "connected", "mode": "simulator_fallback", "port": self.port, "warning": str(e)}

    def disconnect(self):
        """
        Disconnects serial communication and stops reader thread.
        """
        self._stop_event.set()
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=1.0)
            
        if self.serial_conn:
            try:
                self.serial_conn.write(b"STOP\n")
                self.serial_conn.close()
            except Exception:
                pass
            self.serial_conn = None
            
        self.is_connected = False
        self.is_scanning = False
        print("[HardwareManager] Hardware disconnected.")
        return {"status": "disconnected"}

    def _start_reader_thread(self):
        self._stop_event.clear()
        self._thread = threading.Thread(target=self._reader_loop, daemon=True)
        self._thread.start()

    def _reader_loop(self):
        while not self._stop_event.is_set():
            if self.is_simulator:
                # Run simulator sweep step
                angle, raw_samples = self.mock_hw.step_sweep()
                self._process_incoming_ascan(angle, raw_samples)
                time.sleep(0.04)  # ~25 FPS sweep line rate
            elif self.serial_conn and self.serial_conn.is_open:
                try:
                    line = self.serial_conn.readline().decode('utf-8', errors='ignore').strip()
                    if line.startswith("{") and line.endswith("}"):
                        data = json.loads(line)
                        if data.get("type") == "ascan_line":
                            angle = data.get("angle", 0)
                            samples = data.get("samples", [])
                            self._process_incoming_ascan(angle, samples)
                except Exception:
                    time.sleep(0.01)
            else:
                time.sleep(0.1)

    def _process_incoming_ascan(self, angle_deg, raw_samples):
        """
        Executes DSP Signal Processing pipeline on incoming raw RF A-scan line:
        1. Butterworth Bandpass Filter
        2. Hilbert Envelope Detection
        3. Time-Gain Compensation (TGC)
        4. Log Dynamic Range Compression
        """
        if not raw_samples:
            return

        # 1. Bandpass filter
        filtered = butterworth_bandpass_filter(raw_samples)
        
        # 2. Envelope detection
        envelope = hilbert_envelope_detection(filtered)
        
        # 3. Time-Gain Compensation
        tgc_env = apply_time_gain_compensation(envelope)
        
        # 4. Log compression to 8-bit scale (0-255)
        processed_8bit = log_compress(tgc_env)
        
        with self._lock:
            self.current_angle = angle_deg
            self.active_ascan_samples = raw_samples[:128]  # Keep 128 for oscilloscope UI
            self.raw_ascan_lines[angle_deg] = raw_samples
            self.radial_lines[angle_deg] = processed_8bit
            
            if angle_deg == 180 or angle_deg == 0:
                self.frame_count += 1

    def get_reconstructed_bmode_frame(self, grid_size=512):
        """
        Executes Scan Conversion and returns reconstructed B-mode frame as 512x512 NumPy array.
        """
        with self._lock:
            lines_copy = dict(self.radial_lines)
            
        bmode_frame = polar_to_cartesian_scan_convert(lines_copy, grid_size=grid_size)
        return bmode_frame

    def get_current_status(self):
        """
        Returns real-time status summary for UI polling / SSE.
        """
        with self._lock:
            return {
                "is_connected": self.is_connected,
                "is_simulator": self.is_simulator,
                "port": self.port,
                "current_angle": self.current_angle,
                "line_count": len(self.radial_lines),
                "frame_count": self.frame_count,
                "active_ascan_waveform": self.active_ascan_samples[:64]
            }

# Global singleton instance
HARDWARE_MANAGER = HardwareManager()
