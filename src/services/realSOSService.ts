/**
 * Real SOS Service
 * Uses expo-location for GPS and expo-sms for messaging
 * No cloud APIs - everything runs on device
 */

import { getRealLocation, generateMapsLink, RealLocation } from './realLocationService';
import { sendAutoSMS } from './nativeAutoSMSService';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  try {
    // Step 1: Get real GPS location
    console.log('📍 Getting real GPS location...');
    const location = await getRealLocation();
    console.log('✅ Location obtained:', location);

    // Generate Google Maps link
    const mapsLink = generateMapsLink(location.latitude, location.longitude);
    console.log('🗺️ Maps link:', mapsLink);

    // Step 2: Send automatic SMS (no user interaction!)
    console.log('📱 Sending automatic SMS...');
    const smsResult = await sendAutoSMS(location.latitude, location.longitude, type);
    console.log('SMS result:', smsResult);

    // Step 3: Save to local history
    await saveToHistory({
      type,
      location,
      mapsLink,
      timestamp: Date.now(),
      smsSuccess: smsResult.success,
    });

    return {
      success: true,
      location,
      mapsLink,
      smsResult: smsResult.message,
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
