/**
 * Silent Panic Mode Service
 * Triggers SOS without any visible UI or sound
 */

import { Vibration } from 'react-native';
import { getRealLocation } from './realLocationService';
import { sendAutoSMS } from './nativeAutoSMSService';
import { startRecording } from './voiceRecordingService';
import { startLiveTracking } from './liveLocationTrackingService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SILENT_MODE_KEY = 'silent_panic_enabled';
const SILENT_TRIGGER_KEY = 'silent_panic_trigger'; // e.g., "volume_button_3x"

/**
 * Check if silent panic mode is enabled
 */
export async function isSilentPanicEnabled(): Promise<boolean> {
  try {
    const enabled = await AsyncStorage.getItem(SILENT_MODE_KEY);
    return enabled === 'true';
  } catch (error) {
    return false;
  }
}

/**
 * Enable/disable silent panic mode
 */
export async function setSilentPanicMode(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(SILENT_MODE_KEY, enabled ? 'true' : 'false');
    console.log(`Silent panic mode: ${enabled ? 'enabled' : 'disabled'}`);
  } catch (error) {
    console.error('Failed to set silent panic mode:', error);
  }
}

/**
 * Trigger silent panic
 * - No UI shown
 * - No sound
 * - Only brief vibration
 * - Sends SMS
 * - Starts recording
 * - Starts live tracking
 */
export async function triggerSilentPanic(): Promise<{ success: boolean; message: string }> {
  try {
    console.log('🤫 Silent panic triggered');

    // Check if enabled
    const enabled = await isSilentPanicEnabled();
    if (!enabled) {
      return {
        success: false,
        message: 'Silent panic mode is disabled',
      };
    }

    // Brief vibration (only feedback)
    Vibration.vibrate([100, 200, 100]);

    // Get location silently
    let location;
    try {
      location = await getRealLocation();
      console.log('📍 Location obtained silently');
    } catch (error) {
      console.error('Location failed in silent mode:', error);
      // Continue anyway
    }

    // Send SMS silently
    if (location) {
      try {
        await sendAutoSMS(location.latitude, location.longitude, 'SILENT_PANIC');
        console.log('📱 SMS sent silently');
      } catch (error) {
        console.error('SMS failed in silent mode:', error);
      }
    }

    // Start voice recording silently
    try {
      await startRecording();
      console.log('🎤 Recording started silently');
    } catch (error) {
      console.error('Recording failed in silent mode:', error);
    }

    // Start live tracking silently
    if (location) {
      try {
        const incidentId = `silent_${Date.now()}`;
        await startLiveTracking(incidentId);
        console.log('📍 Live tracking started silently');
      } catch (error) {
        console.error('Tracking failed in silent mode:', error);
      }
    }

    // Save incident silently
    await saveSilentIncident(location);

    return {
      success: true,
      message: 'Silent panic activated',
    };
  } catch (error) {
    console.error('❌ Silent panic failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed',
    };
  }
}

/**
 * Save silent panic incident
 */
async function saveSilentIncident(location: any): Promise<void> {
  try {
    const incident = {
      type: 'silent_panic',
      location,
      timestamp: Date.now(),
      recordingStarted: true,
      trackingStarted: true,
    };

    const existing = await AsyncStorage.getItem('silent_incidents');
    const incidents = existing ? JSON.parse(existing) : [];
    incidents.unshift(incident);

    // Keep last 50
    if (incidents.length > 50) {
      incidents.splice(50);
    }

    await AsyncStorage.setItem('silent_incidents', JSON.stringify(incidents));
  } catch (error) {
    console.error('Failed to save silent incident:', error);
  }
}

/**
 * Get silent panic history
 */
export async function getSilentPanicHistory(): Promise<any[]> {
  try {
    const data = await AsyncStorage.getItem('silent_incidents');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    return [];
  }
}

/**
 * Configure silent panic trigger
 * Options: 'volume_button_3x', 'power_button_5x', 'shake_pattern'
 */
export async function setSilentPanicTrigger(trigger: string): Promise<void> {
  try {
    await AsyncStorage.setItem(SILENT_TRIGGER_KEY, trigger);
    console.log(`Silent panic trigger set to: ${trigger}`);
  } catch (error) {
    console.error('Failed to set trigger:', error);
  }
}

/**
 * Get current trigger setting
 */
export async function getSilentPanicTrigger(): Promise<string> {
  try {
    const trigger = await AsyncStorage.getItem(SILENT_TRIGGER_KEY);
    return trigger || 'volume_button_3x';
  } catch (error) {
    return 'volume_button_3x';
  }
}
