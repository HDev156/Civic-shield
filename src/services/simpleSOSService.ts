/**
 * Simple SOS Service - No complex dependencies
 * Uses navigator.geolocation and Textbelt SMS
 */

import { getCurrentLocation } from './simpleLocationService';
import { sendTextbeltSMS } from './textbeltSMSService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SimpleSOSResult {
  latitude: number;
  longitude: number;
  timestamp: string;
}

/**
 * Send simple SOS alert
 * 1. Get location using navigator.geolocation
 * 2. Send SMS via Textbelt
 * 3. Save to local storage
 */
export async function sendSimpleSOS(
  type: 'kidnap' | 'assault' | 'emergency' = 'emergency'
): Promise<SimpleSOSResult> {
  console.log('');
  console.log('═══════════════════════════════════════');
  console.log('🚨 SIMPLE SOS TRIGGERED');
  console.log('═══════════════════════════════════════');
  console.log(`Type: ${type.toUpperCase()}`);
  console.log(`Time: ${new Date().toISOString()}`);

  try {
    // Step 1: Get location
    console.log('📍 Step 1: Getting location...');
    const location = await getCurrentLocation();
    console.log(`✅ Location: ${location.latitude}, ${location.longitude}`);

    // Step 2: Send SMS
    console.log('📱 Step 2: Sending SMS...');
    try {
      await sendTextbeltSMS(location.latitude, location.longitude, type);
      console.log('✅ SMS sent');
    } catch (smsError) {
      console.error('⚠️ SMS failed (non-critical):', smsError);
      // Continue even if SMS fails
    }

    // Step 3: Save to local storage
    console.log('💾 Step 3: Saving to local storage...');
    const incident = {
      latitude: location.latitude,
      longitude: location.longitude,
      type,
      timestamp: new Date().toISOString(),
      accuracy: location.accuracy
    };

    try {
      // Get existing incidents
      const existingData = await AsyncStorage.getItem('sos_incidents');
      const incidents = existingData ? JSON.parse(existingData) : [];
      
      // Add new incident
      incidents.unshift(incident); // Add to beginning
      
      // Keep only last 50 incidents
      if (incidents.length > 50) {
        incidents.splice(50);
      }
      
      // Save back
      await AsyncStorage.setItem('sos_incidents', JSON.stringify(incidents));
      console.log('✅ Saved to local storage');
    } catch (storageError) {
      console.error('⚠️ Storage failed (non-critical):', storageError);
    }

    console.log('');
    console.log('✅ SIMPLE SOS COMPLETED');
    console.log('═══════════════════════════════════════');
    console.log('');

    return {
      latitude: location.latitude,
      longitude: location.longitude,
      timestamp: incident.timestamp
    };

  } catch (error: any) {
    console.error('');
    console.error('❌ SOS ERROR:', error.message || error);
    console.error('');
    throw error;
  }
}

/**
 * Get SOS history from local storage
 */
export async function getSOSHistory(): Promise<any[]> {
  try {
    const data = await AsyncStorage.getItem('sos_incidents');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to get history:', error);
    return [];
  }
}
