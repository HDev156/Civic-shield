/**
 * Advanced Features Manager
 * Safely manages optional features with crash protection
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface FeatureStatus {
  voiceRecording: boolean;
  photoCapture: boolean;
  liveTracking: boolean;
  policeStationFinder: boolean;
  silentPanic: boolean;
}

const FEATURES_KEY = 'advanced_features_enabled';

/**
 * Get enabled features
 */
export async function getEnabledFeatures(): Promise<FeatureStatus> {
  try {
    const data = await AsyncStorage.getItem(FEATURES_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to get enabled features:', error);
  }

  // Default: all features disabled for safety
  return {
    voiceRecording: false,
    photoCapture: false,
    liveTracking: false,
    policeStationFinder: false,
    silentPanic: false,
  };
}

/**
 * Enable/disable a feature
 */
export async function setFeatureEnabled(
  feature: keyof FeatureStatus,
  enabled: boolean
): Promise<void> {
  try {
    const current = await getEnabledFeatures();
    current[feature] = enabled;
    await AsyncStorage.setItem(FEATURES_KEY, JSON.stringify(current));
    console.log(`Feature ${feature}: ${enabled ? 'enabled' : 'disabled'}`);
  } catch (error) {
    console.error(`Failed to set feature ${feature}:`, error);
  }
}

/**
 * Check if a feature is enabled
 */
export async function isFeatureEnabled(feature: keyof FeatureStatus): Promise<boolean> {
  try {
    const features = await getEnabledFeatures();
    return features[feature];
  } catch (error) {
    console.error(`Failed to check feature ${feature}:`, error);
    return false;
  }
}

/**
 * Enable all features
 */
export async function enableAllFeatures(): Promise<void> {
  try {
    const allEnabled: FeatureStatus = {
      voiceRecording: true,
      photoCapture: true,
      liveTracking: true,
      policeStationFinder: true,
      silentPanic: true,
    };
    await AsyncStorage.setItem(FEATURES_KEY, JSON.stringify(allEnabled));
    console.log('All features enabled');
  } catch (error) {
    console.error('Failed to enable all features:', error);
  }
}

/**
 * Disable all features
 */
export async function disableAllFeatures(): Promise<void> {
  try {
    const allDisabled: FeatureStatus = {
      voiceRecording: false,
      photoCapture: false,
      liveTracking: false,
      policeStationFinder: false,
      silentPanic: false,
    };
    await AsyncStorage.setItem(FEATURES_KEY, JSON.stringify(allDisabled));
    console.log('All features disabled');
  } catch (error) {
    console.error('Failed to disable all features:', error);
  }
}

/**
 * Get feature availability (checks if dependencies are installed)
 */
export async function getFeatureAvailability(): Promise<{
  [key in keyof FeatureStatus]: { available: boolean; reason?: string };
}> {
  const availability: any = {};

  // Voice Recording
  try {
    require('expo-av');
    availability.voiceRecording = { available: true };
  } catch (error) {
    availability.voiceRecording = {
      available: false,
      reason: 'expo-av not installed',
    };
  }

  // Photo Capture
  try {
    require('expo-image-picker');
    availability.photoCapture = { available: true };
  } catch (error) {
    availability.photoCapture = {
      available: false,
      reason: 'expo-image-picker not installed',
    };
  }

  // Live Tracking
  try {
    require('expo-location');
    availability.liveTracking = { available: true };
  } catch (error) {
    availability.liveTracking = {
      available: false,
      reason: 'expo-location not installed',
    };
  }

  // Police Station Finder (always available, uses Google Maps)
  availability.policeStationFinder = { available: true };

  // Silent Panic (always available)
  availability.silentPanic = { available: true };

  return availability;
}
