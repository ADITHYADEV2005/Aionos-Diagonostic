"""
RP2040 MicroPython Firmware - Aionos Diagnostic Ultrasound Scanner
Transducer Angle Sweep (SG90 Servo) & High-Voltage Pulse A-Scan Acquisition
"""

import machine
import time
import sys
import ujson

# ─── Hardware Pin Definitions ────────────────────────────────────────────────
SERVO_PIN = 15      # GPIO 15: SG90 Micro-Servo PWM (0 to 180 degrees)
PULSE_PIN = 14      # GPIO 14: High-Voltage Driver Trigger (XL6009 Boost + MOSFET)
ADC_PIN = 26        # GPIO 26 / ADC0: Amplified RF Receiver Signal Input (AD8001)

# ─── Servo Configuration (50Hz PWM) ──────────────────────────────────────────
servo_pwm = machine.PWM(machine.Pin(SERVO_PIN))
servo_pwm.freq(50)

def angle_to_duty(angle_deg):
    """
    Converts 0-180 degrees to 16-bit PWM duty cycle for SG90 servo (0.5ms to 2.5ms pulse).
    0 deg   => ~1638 duty (~0.5ms)
    180 deg => ~8192 duty (~2.5ms)
    """
    min_duty = 1638
    max_duty = 8192
    duty = min_duty + int((angle_deg / 180.0) * (max_duty - min_duty))
    return max(min_duty, min(max_duty, duty))

def set_servo_angle(angle_deg):
    duty = angle_to_duty(angle_deg)
    servo_pwm.duty_u16(duty)

# ─── Pulse Trigger & ADC Sampler ─────────────────────────────────────────────
pulse_pin = machine.Pin(PULSE_PIN, machine.Pin.OUT)
pulse_pin.value(0)
adc = machine.ADC(machine.Pin(ADC_PIN))

SAMPLES_PER_LINE = 256  # A-scan depth sample count per angle line

def fire_pulse_and_sample_ascan(num_samples=SAMPLES_PER_LINE):
    """
    Fires a ~1us high-voltage excitation impulse and immediately samples ADC0.
    Returns array of 12-bit ADC voltage readings (0 to 4095).
    """
    samples = [0] * num_samples
    
    # 1. Fire acoustic pulse impulse
    pulse_pin.value(1)
    time.sleep_us(1)  # 1us excitation pulse width
    pulse_pin.value(0)
    
    # 2. Sample returning echo envelope (ADC0) at maximum ADC clock speed
    for i in range(num_samples):
        samples[i] = adc.read_u16() >> 4  # Scale 16-bit to 12-bit (0-4095)
        time.sleep_us(2)  # Sampling period (~500 kSps)
        
    return samples

# ─── Main Communication Loop ─────────────────────────────────────────────────
def main():
    set_servo_angle(90)  # Center probe at start
    time.sleep(0.5)
    
    print(ujson.dumps({"status": "ready", "mcu": "RP2040", "firmware": "v1.2"}))
    
    current_angle = 0
    sweep_direction = 1  # +1 = 0->180, -1 = 180->0
    is_scanning = False
    
    poll_obj = sys.stdin
    
    while True:
        # Check for incoming serial commands over USB CDC
        # MicroPython sys.stdin non-blocking check
        try:
            cmd_line = sys.stdin.readline()
            if cmd_line:
                cmd_str = cmd_line.strip()
                if cmd_str == "PING":
                    print(ujson.dumps({"status": "pong", "device": "AIONOS_US_PROBE"}))
                elif cmd_str == "START":
                    is_scanning = True
                    print(ujson.dumps({"status": "scanning_started"}))
                elif cmd_str == "STOP":
                    is_scanning = False
                    print(ujson.dumps({"status": "scanning_stopped"}))
                elif cmd_str.startswith("GOTO:"):
                    try:
                        target_ang = int(cmd_str.split(":")[1])
                        set_servo_angle(target_ang)
                        current_angle = target_ang
                        print(ujson.dumps({"status": "moved", "angle": current_angle}))
                    except Exception:
                        pass
        except Exception:
            pass

        if is_scanning:
            # Move servo to current angle
            set_servo_angle(current_angle)
            time.sleep_ms(15)  # Wait for servo motor step settling
            
            # Fire pulse & sample RF echo A-scan line
            rf_samples = fire_pulse_and_sample_ascan(SAMPLES_PER_LINE)
            
            # Transmit A-scan line frame over USB serial JSON
            packet = {
                "type": "ascan_line",
                "angle": current_angle,
                "samples": rf_samples
            }
            print(ujson.dumps(packet))
            
            # Increment angle step for sector sweep
            current_angle += sweep_direction
            if current_angle >= 180:
                current_angle = 180
                sweep_direction = -1
            elif current_angle <= 0:
                current_angle = 0
                sweep_direction = 1
        else:
            time.sleep_ms(50)

if __name__ == "__main__":
    main()
