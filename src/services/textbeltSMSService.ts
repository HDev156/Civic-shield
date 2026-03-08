/**
 * Textbelt SMS Service - Free SMS API
 * Sends SMS using Textbelt's free tier (1 SMS per day per number)
 */

import { getEmergencyContacts } from './autoSMSService';

/**
 * Send SMS using Textbelt API
 * Free tier: 1 text per day per phone number
 */
export async function sendTextbeltSMS(
  latitude: number,
  longitude: number,
  incidentType: string
): Promise<void> {
  try {
    console.log('');
    console.log('═══════════════════════════════════════');
    console.log('📱 TEXTBELT SMS SERVICE');
    console.log('═══════════════════════════════════════');

    const contacts = await getEmergencyContacts();
    console.log(`📋 Emergency contacts found: ${contacts.length}`);
    
    if (contacts.length === 0) {
      console.warn('⚠️ No emergency contacts configured');
      console.log('═══════════════════════════════════════');
      return;
    }

    console.log('📞 Contacts:');
    contacts.forEach((c, i) => {
      console.log(`   ${i + 1}. ${c.name}: ${c.phone}`);
    });

    const mapsLink = `https://maps.google.com/?q=${latitude},${longitude}`;
    
    const message = `🚨 EMERGENCY ALERT

I may be in danger. My location:
${mapsLink}

Type: ${incidentType.toUpperCase()}
Time: ${new Date().toLocaleString()}

Sent from Civic Shield`;

    console.log('📤 Sending SMS via Textbelt...');

    // Send SMS to each contact
    const results = await Promise.all(
      contacts.map(async (contact) => {
        try {
          console.log(`📱 Sending to ${contact.name} (${contact.phone})...`);
          
          const response = await fetch('https://textbelt.com/text', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              phone: contact.phone,
              message: message,
              key: 'textbelt', // Free tier key
            }),
          });

          const result = await response.json();
          
          if (result.success) {
            console.log(`✅ SMS sent to ${contact.name}`);
            console.log(`   Quota remaining: ${result.quotaRemaining}`);
            return { success: true, contact: contact.name };
          } else {
            console.error(`❌ Failed to send to ${contact.name}: ${result.error}`);
            return { success: false, contact: contact.name, error: result.error };
          }
        } catch (error) {
          console.error(`❌ Error sending to ${contact.name}:`, error);
          return { success: false, contact: contact.name, error: String(error) };
        }
      })
    );

    // Summary
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log('');
    console.log('📊 SMS SUMMARY:');
    console.log(`   ✅ Sent: ${successful}`);
    console.log(`   ❌ Failed: ${failed}`);
    
    if (failed > 0) {
      console.log('   Failed contacts:');
      results.filter(r => !r.success).forEach(r => {
        console.log(`      - ${r.contact}: ${r.error}`);
      });
    }

    console.log('═══════════════════════════════════════');
    console.log('');

    // Show alert to user
    const { Alert } = require('react-native');
    if (successful > 0) {
      Alert.alert(
        'SMS Sent',
        `Emergency SMS sent to ${successful} contact(s).\n\nNote: Textbelt free tier allows 1 SMS per day per number.`,
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        'SMS Failed',
        'Failed to send SMS. Please use the Share button to send manually.',
        [{ text: 'OK' }]
      );
    }

  } catch (error) {
    console.error('');
    console.error('═══════════════════════════════════════');
    console.error('❌ TEXTBELT SMS ERROR');
    console.error('═══════════════════════════════════════');
    console.error('Error:', error);
    console.error('═══════════════════════════════════════');
    console.error('');
    
    const { Alert } = require('react-native');
    Alert.alert(
      'SMS Error',
      'Failed to send SMS. Please use the Share button to send your location manually.',
      [{ text: 'OK' }]
    );
  }
}

/**
 * Check if Textbelt is available
 */
export function isTextbeltAvailable(): boolean {
  return true; // Always available (uses HTTP API)
}
