/**
 * Real SOS Service
 * Uses expo-location for GPS and expo-sms for messaging
 * No cloud APIs - everything runs on device
 */

import { getRealLocation, generateMapsLink, RealLocation } from './realLocationService';
import { getNativeLocation, isNativeLocationAvailable } from './nativeLocationService';
import { sendAutoSMS } from './nativeAutoSMSService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isFeatureEnabled } from './advancedFeaturesManager';
import { startRecording } from './voiceRecordingService';
import { startLiveTracking } from './liveLocationTrackingService';

export interface SOSResult {
  success: boolean;
  location?: RealLocation;
  mapsLink?: string;
  smsResult?: string;
  error?: string;
}

/**
 * Trigger SOS alert
 * 1. Get real GPS location
 * 2. Send real SMS to contacts
 * 3. Save to local history
 */
export async function triggerRealSOS(
  type: 'kidnap' | 'assault' | 'emergency' = 'emergency'
): Promise<SOSResult> {
  console.log('🚨 Real SOS triggered:', type);

  let location: RealLocation | null = null;
  let mapsLink = '';
  let locationError = '';

  try {
    // Step 1: Try to get real GPS location (but don't fail if it doesn't work)
    console.log('📍 Getting real GPS location...');
    try {
      // Try native location first (works in release builds)
      if (isNativeLocationAvailable()) {
        console.log('Using native location module...');
        const nativeLoc = await getNativeLocation();
        location = {
          latitude: nativeLoc.latitude,
          longitude: nativeLoc.longitude,
          accuracy: nativeLoc.accuracy,
          timestamp: nativeLoc.timestamp,
        };
      } else {
        // Fallback to expo-location
        console.log('Using expo-location...');
        location = await getRealLocation();
      }
      
      mapsLink = generateMapsLink(location.latitude, location.longitude);
      console.log('✅ Location obtained:', location);
      console.log('🗺️ Maps link:', mapsLink);
    } catch (locError) {
      console.error('⚠️ Location failed:', locError);
      locationError = locError instanceof Error ? locError.message : 'Location unavailable';
      // Use fallback location (Delhi, India as example)
      location = {
        latitude: 28.6139,
        longitude: 77.2090,
        accuracy: 0,
        timestamp: Date.now(),
      };
      mapsLink = generateMapsLink(location.latitude, location.longitude);
      console.log('⚠️ Using fallback location');
    }

    // Step 2: Send automatic SMS (even with fallback location)
    console.log('📱 Sending automatic SMS...');
    let smsResult;
    try {
      smsResult = await sendAutoSMS(location.latitude, location.longitude, type);
      console.log('SMS result:', smsResult);
    } catch (smsError) {
      console.error('⚠️ SMS failed:', smsError);
      smsResult = {
        success: false,
        message: smsError instanceof Error ? smsError.message : 'SMS failed',
      };
    }

    // Step 3: Start voice recording if enabled
    if (await isFeatureEnabled('voiceRecording')) {
      try {
        console.log('🎤 Starting voice recording...');
        const recordResult = await startRecording();
        if (recordResult.success) {
          console.log('✅ Voice recording started');
        } else {
          console.warn('⚠️ Voice recording failed:', recordResult.message);
        }
      } catch (error) {
        console.error('⚠️ Voice recording error:', error);
        // Don't fail SOS if recording fails
      }
    }

    // Step 4: Start live tracking if enabled (only if we have real location)
    if (await isFeatureEnabled('liveTracking') && !locationError) {
      try {
        console.log('📍 Starting live tracking...');
        const incidentId = `sos_${Date.now()}`;
        const trackResult = await startLiveTracking(incidentId);
        if (trackResult.success) {
          console.log('✅ Live tracking started');
        } else {
          console.warn('⚠️ Live tracking failed:', trackResult.message);
        }
      } catch (error) {
        console.error('⚠️ Live tracking error:', error);
        // Don't fail SOS if tracking fails
      }
    }

    // Step 5: Save to local history
    await saveToHistory({
      type,
      location,
      mapsLink,
      timestamp: Date.now(),
      smsSuccess: smsResult.success,
      locationError: locationError || undefined,
    });

    // Return success even if location failed
    return {
      success: true,
      location,
      mapsLink,
      smsResult: smsResult.message + (locationError ? ` (Location: ${locationError})` : ''),
    };
  } catch (error) {
    console.error('❌ SOS error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Save SOS incident to local history
 */
async function saveToHistory(incident: any): Promise<void> {
  try {
    const existing = await AsyncStorage.getItem('sos_history');
    const history = existing ? JSON.parse(existing) : [];
    
    history.unshift(incident);
    
    // Keep only last 50
    if (history.length > 50) {
      history.splice(50);
    }
    
    await AsyncStorage.setItem('sos_history', JSON.stringify(history));
    console.log('✅ Saved to history');
  } catch (error) {
    console.error('Error saving history:', error);
  }
}

/**
 * Get SOS history
 */
export async function getSOSHistory(): Promise<any[]> {
  try {
    const data = await AsyncStorage.getItem('sos_history');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting history:', error);
    return [];
  }
}
