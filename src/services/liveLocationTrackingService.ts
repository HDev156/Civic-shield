/**
 * Live Location Tracking Service
 * Tracks location in real-time during emergency
 */

import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCATION_TRACKING_TASK = 'background-location-tracking';
const LOCATION_HISTORY_KEY = 'live_location_history';

let isTracking = false;
let locationSubscription: Location.LocationSubscription | null = null;

/**
 * Check if live tracking is available
 */
export async function isLiveTrackingAvailable(): Promise<boolean> {
  try {
    const { status } = await Location.getBackgroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.warn('Live tracking not available:', error);
    return false;
  }
}

/**
 * Request background location permission
 */
export async function requestBackgroundPermission(): Promise<boolean> {
  try {
    // First request foreground
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus !== 'granted') {
      return false;
    }

    // Then request background
    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    return backgroundStatus === 'granted';
  } catch (error) {
    console.error('Error requesting background permission:', error);
    return false;
  }
}

/**
 * Start live location tracking
 */
export async function startLiveTracking(incidentId: string): Promise<{ success: boolean; message: string }> {
  try {
    console.log('📍 Starting live location tracking...');

    // Check permission
    const hasPermission = await requestBackgroundPermission();
    if (!hasPermission) {
      return {
        success: false,
        message: 'Background location permission denied',
      };
    }

    // Stop any existing tracking
    if (locationSubscription) {
      await stopLiveTracking();
    }

    // Start foreground tracking (works in release builds)
    locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 10000, // Update every 10 seconds
        distanceInterval: 10, // Or every 10 meters
      },
      async (location) => {
        console.log('📍 Location update:', {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        });

        // Save location to history
        await saveLocationUpdate(incidentId, {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy || 0,
          timestamp: location.timestamp,
        });
      }
    );

    isTracking = true;

    console.log('✅ Live tracking started');
    return {
      success: true,
      message: 'Live tracking started',
    };
  } catch (error) {
    console.error('❌ Failed to start live tracking:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Tracking failed',
    };
  }
}

/**
 * Stop live location tracking
 */
export async function stopLiveTracking(): Promise<void> {
  try {
    if (locationSubscription) {
      locationSubscription.remove();
      locationSubscription = null;
    }
    isTracking = false;
    console.log('🛑 Live tracking stopped');
  } catch (error) {
    console.error('Error stopping live tracking:', error);
  }
}

/**
 * Get tracking status
 */
export function getTrackingStatus(): boolean {
  return isTracking;
}

/**
 * Save location update to history
 */
async function saveLocationUpdate(
  incidentId: string,
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: number;
  }
): Promise<void> {
  try {
    const key = `${LOCATION_HISTORY_KEY}_${incidentId}`;
    const existing = await AsyncStorage.getItem(key);
    const history = existing ? JSON.parse(existing) : [];

    history.push({
      ...location,
      timestamp: Date.now(),
    });

    // Keep only last 100 locations
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }

    await AsyncStorage.setItem(key, JSON.stringify(history));
  } catch (error) {
    console.error('Failed to save location update:', error);
  }
}

/**
 * Get location history for incident
 */
export async function getLocationHistory(incidentId: string): Promise<any[]> {
  try {
    const key = `${LOCATION_HISTORY_KEY}_${incidentId}`;
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to get location history:', error);
    return [];
  }
}
