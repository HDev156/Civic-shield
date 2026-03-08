/**
 * Simple Location Service using navigator.geolocation
 * This works in React Native release builds (unlike expo-location)
 */

export interface LocationResult {
  latitude: number;
  longitude: number;
  accuracy: number;
}

/**
 * Get current location using navigator.geolocation
 * This is a web API that works in React Native
 */
export async function getCurrentLocation(): Promise<LocationResult> {
  return new Promise((resolve, reject) => {
    console.log('📍 Getting location using navigator.geolocation...');
    
    // Check if geolocation is available
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your device'));
      return;
    }

    // Set timeout
    const timeoutId = setTimeout(() => {
      reject(new Error('Location request timed out. Please make sure GPS is enabled.'));
    }, 15000); // 15 second timeout

    // Get current position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timeoutId);
        console.log('✅ Location obtained:', {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
        
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy || 0
        });
      },
      (error) => {
        clearTimeout(timeoutId);
        console.error('❌ Location error:', error);
        
        let errorMessage = 'Unable to get location. ';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Location permission denied. Please enable location in Settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location unavailable. Please make sure GPS is enabled.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out. Please try again.';
            break;
          default:
            errorMessage += error.message;
        }
        
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  });
}

/**
 * Check if location is available
 */
export function isLocationAvailable(): boolean {
  return !!navigator.geolocation;
}
