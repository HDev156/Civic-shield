/**
 * Photo Capture Service
 * Captures photos during emergency with safe error handling
 */

import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

/**
 * Check if camera is available
 */
export async function isCameraAvailable(): Promise<boolean> {
  try {
    const { status } = await ImagePicker.getCameraPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.warn('Camera not available:', error);
    return false;
  }
}

/**
 * Request camera permission
 */
export async function requestCameraPermission(): Promise<boolean> {
  try {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting camera permission:', error);
    return false;
  }
}

/**
 * Capture photo using camera
 */
export async function capturePhoto(): Promise<{ success: boolean; uri?: string; message: string }> {
  try {
    console.log('📸 Opening camera...');

    // Check permission
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      return {
        success: false,
        message: 'Camera permission denied',
      };
    }

    // Launch camera
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.7, // Compress to save space
      exif: true, // Include location data if available
    });

    if (result.canceled) {
      return {
        success: false,
        message: 'Photo capture cancelled',
      };
    }

    const uri = result.assets[0].uri;
    console.log('✅ Photo captured:', uri);

    return {
      success: true,
      uri,
      message: 'Photo captured',
    };
  } catch (error) {
    console.error('❌ Failed to capture photo:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Photo capture failed',
    };
  }
}

/**
 * Quick capture without preview (for emergency)
 */
export async function quickCapture(): Promise<{ success: boolean; uri?: string; message: string }> {
  try {
    console.log('📸 Quick capture...');

    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      return {
        success: false,
        message: 'Camera permission denied',
      };
    }

    // Launch camera with minimal options for speed
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.5, // Lower quality for speed
    });

    if (result.canceled) {
      return {
        success: false,
        message: 'Cancelled',
      };
    }

    return {
      success: true,
      uri: result.assets[0].uri,
      message: 'Photo captured',
    };
  } catch (error) {
    console.error('Quick capture failed:', error);
    return {
      success: false,
      message: 'Failed',
    };
  }
}

/**
 * Save photo to permanent storage
 */
export async function savePhoto(uri: string, incidentId: string): Promise<string> {
  try {
    const directory = `${FileSystem.documentDirectory}incidents/${incidentId}/`;
    await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
    
    const filename = `photo_${Date.now()}.jpg`;
    const newUri = `${directory}${filename}`;
    
    await FileSystem.copyAsync({
      from: uri,
      to: newUri,
    });
    
    console.log('✅ Photo saved:', newUri);
    return newUri;
  } catch (error) {
    console.error('Failed to save photo:', error);
    return uri; // Return original URI if save fails
  }
}
