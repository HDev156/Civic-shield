/**
 * Real SMS Service using expo-sms
 * Sends actual SMS messages from the device
 */

import * as SMS from 'expo-sms';
import { getEmergencyContacts } from './autoSMSService';

/**
 * Check if SMS is available on device
 */
export async function isSMSAvailable(): Promise<boolean> {
  try {
    return await SMS.isAvailableAsync();
  } catch (error) {
    console.error('Error checking SMS availability:', error);
    return false;
  }
}

/**
 * Send real SMS to emergency contacts
 */
export async function sendRealSMS(
  latitude: number,
  longitude: number,
  incidentType: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Check if SMS is available
    const available = await isSMSAvailable();
    if (!available) {
      return {
        success: false,
        message: 'SMS not available on this device',
      };
    }

    // Get emergency contacts
    const contacts = await getEmergencyContacts();
    if (contacts.length === 0) {
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

    // Send SMS
    const { result } = await SMS.sendSMSAsync(phoneNumbers, message);

    if (result === 'sent') {
      return {
        success: true,
        message: `SMS sent to ${contacts.length} contact(s)`,
      };
    } else {
      return {
        success: false,
        message: `SMS result: ${result}`,
      };
    }
  } catch (error) {
    console.error('Error sending SMS:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
