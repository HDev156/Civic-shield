/**
 * Native Auto SMS Service
 * Uses native Android SmsManager to send SMS automatically
 * NO user interaction required!
 */

import { NativeModules } from 'react-native';
import { getEmergencyContacts } from './autoSMSService';

const { SmsModule } = NativeModules;

/**
 * Send SMS automatically using native Android SmsManager
 * This sends SMS in the background without opening messaging app
 */
export async function sendAutoSMS(
  latitude: number,
  longitude: number,
  incidentType: string
): Promise<{ success: boolean; message: string }> {
  try {
    console.log('📱 Sending automatic SMS via native module...');

    // Check if native module is available
    if (!SmsModule) {
      console.error('❌ Native SMS module not available');
      return {
        success: false,
        message: 'Native SMS module not available',
      };
    }

    // Get emergency contacts
    const contacts = await getEmergencyContacts();
    if (contacts.length === 0) {
      console.warn('⚠️ No emergency contacts configured');
      return {
        success: false,
        message: 'No emergency contacts configured',
      };
    }

    // Create Google Maps link
    const mapsLink = `https://maps.google.com/?q=${latitude},${longitude}`;

    // Create SMS message
    const message = `🚨 SOS! I need help.

My current location:
${mapsLink}

Type: ${incidentType.toUpperCase()}
Time: ${new Date().toLocaleString()}

Sent from Civic Shield`;

    // Get phone numbers
    const phoneNumbers = contacts.map(c => c.phone);

    console.log(`📤 Sending to ${phoneNumbers.length} contact(s)...`);

    // Send SMS using native module
    const result = await SmsModule.sendSms(phoneNumbers, message);

    console.log('✅ SMS sent:', result);

    return {
      success: true,
      message: result,
    };
  } catch (error) {
    console.error('❌ Failed to send SMS:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if native SMS module is available
 */
export function isNativeAutoSMSAvailable(): boolean {
  return !!SmsModule;
}
