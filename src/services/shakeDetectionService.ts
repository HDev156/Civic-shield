/**
 * Shake Detection Service with Safe Initialization
 * Prevents crashes if expo-sensors is unavailable
 */

let Accelerometer: any = null;
let isAvailable = false;

// Safe module loading with try-catch
try {
  console.log('📳 Loading expo-sensors...');
  const sensors = require('expo-sensors');
  Accelerometer = sensors.Accelerometer;
  isAvailable = true;
  console.log('✅ expo-sensors loaded successfully');
} catch (error) {
  console.warn('⚠️ expo-sensors not available:', error);
  console.log('ℹ️ Shake detection will be disabled');
}

interface ShakeConfig {
  threshold: number;
  shakeCount: number;
  timeWindow: number;
}

const DEFAULT_CONFIG: ShakeConfig = {
  threshold: 2.5,
  shakeCount: 3,
  timeWindow: 2000,
};

let subscription: any = null;
let shakeTimestamps: number[] = [];

export function isShakeDetectionAvailable(): boolean {
  return isAvailable;
}

export function startShakeDetection(
  onShakeDetected: () => void,
  config: ShakeConfig = DEFAULT_CONFIG
): void {
  if (!isAvailable || !Accelerometer) {
    console.log('⚠️ Shake detection not available - module not loaded');
    return;
  }

  try {
    console.log('📳 Starting shake detection...');
    console.log('Config:', config);

    stopShakeDetection();

    Accelerometer.setUpdateInterval(100);

    subscription = Accelerometer.addListener((accelerometerData: any) => {
      try {
        const { x, y, z } = accelerometerData;
        const acceleration = Math.sqrt(x * x + y * y + z * z);

        if (acceleration > config.threshold) {
          const now = Date.now();
          shakeTimestamps.push(now);

          shakeTimestamps = shakeTimestamps.filter(
            (timestamp) => now - timestamp < config.timeWindow
          );

          console.log(`📳 Shake detected! Count: ${shakeTimestamps.length}/${config.shakeCount}`);

          if (shakeTimestamps.length >= config.shakeCount) {
            console.log('🚨 SHAKE SOS TRIGGERED!');
            shakeTimestamps = [];
            onShakeDetected();
          }
        }
      } catch (error) {
        console.error('❌ Error in shake detection listener:', error);
      }
    });

    console.log('✅ Shake detection active');
  } catch (error) {
    console.error('❌ Failed to start shake detection:', error);
    isAvailable = false;
  }
}

export function stopShakeDetection(): void {
  try {
    if (subscription) {
      subscription.remove();
      subscription = null;
      shakeTimestamps = [];
      console.log('🛑 Shake detection stopped');
    }
  } catch (error) {
    console.error('❌ Error stopping shake detection:', error);
  }
}
