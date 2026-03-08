/**
 * Native Location Service
 * Uses native Android LocationManager for reliable location in release builds
 */

import { NativeModules } from 'react-native';

const { LocationModule } = NativeModules;

export interface NativeLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

/**
 * Get current location using native Android LocationManager
 * This works in release builds unlike expo-location
 */
export async function getNativeLocation(): Promise<NativeLocation> {
  try {
    console.log('📍 Getting location via native module...');
    
    if (!LocationModule) {
      throw new Error('Native location module not available');
    }

    const location = await LocationModule.getCurrentLocation();
    
    console.log('✅ Native location obtained:', {
      lat: location.latitude,
      lng: location.longitude,
      accuracy: location.accuracy,
    });

    return location;
  } catch (error) {
    console.error('❌ Native location failed:', error);
    throw error;
  }
}

/**
 * Check if native location module is available
 */
export function isNativeLocationAvailable(): boolean {
  return !!LocationModule;
}
