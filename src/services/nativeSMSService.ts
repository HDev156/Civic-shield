/**
 * Native SMS Service using React Native Linking
 * Works in release builds (unlike expo-sms)
 */

import { Linking, Platform } from 'react-native';
import { getEmergencyContacts } from './autoSMSService';

/**
 * Send SMS using native SMS app
 * This opens the SMS app with pre-filled message
 */
export async function sendNativeSMS(
  latitude: number,
  longitude: number,
  incidentType: string
): Promise<void> {
  try {
    console.log('');
    console.log('═══════════════════════════════════════');
    console.log('📱 NATIVE SMS SERVICE');
    console.log('═══════════════════════════════════════');

    const contacts = await getEmergencyContacts();
    console.log(`📋 Emergency contacts found: ${contacts.length}`);
    
    if (contacts.length === 0) {
      console.warn('⚠️ No emergency contacts configured');
      console.warn('   Go to Settings to add emergency contacts');
      console.log('═══════════════════════════════════════');
      console.log('');
      
      // Show alert to user
      const { Alert } = require('react-native');
      Alert.alert(
        'No Emergency Contacts',
        'Please add emergency contacts in Settings before using SOS.',
        [{ text: 'OK' }]
      );
      return;
    }

    console.log('📞 Contacts:');
    contacts.forEach((c, i) => {
      console.log(`   ${i + 1}. ${c.name}: ${c.phone}`);
    });

    const mapsLink = `https://maps.google.com/?q=${latitude},${longitude}`;
    
    const message = `🚨 EMERGENCY ALERT

I may be in danger. My live location:
${mapsLink}

Type: ${incidentType.toUpperCase()}
Time: ${new Date().toLocaleString()}

Sent from Civic Shield`;

    // Get all phone numbers
    const phoneNumbers = contacts.map(c => c.phone).join(',');
    console.log(`📤 Preparing SMS for: ${phoneNumbers}`);

    // Create SMS URL
    let smsUrl: string;
    if (Platform.OS === 'android') {
      // Android format: sms:number1,number2?body=message
      smsUrl = `sms:${phoneNumbers}?body=${encodeURIComponent(message)}`;
    } else {
      // iOS format: sms:number1,number2&body=message
      smsUrl = `sms:${phoneNumbers}&body=${encodeURIComponent(message)}`;
    }

    console.log(`📱 Platform: ${Platform.OS}`);
    console.log(`🔗 SMS URL created (length: ${smsUrl.length} chars)`);
    console.log(`🔗 SMS URL: ${smsUrl.substring(0, 100)}...`);

    // Check if SMS URL can be opened
    console.log('🔍 Checking if SMS app can be opened...');
    const canOpen = await Linking.canOpenURL(smsUrl);
    console.log(`   Can open SMS URL: ${canOpen}`);
    
    if (canOpen) {
      console.log('📤 Opening SMS app...');
      await Linking.openURL(smsUrl);
      console.log('✅ SMS app opened successfully');
      console.log('   User needs to press "Send" button');
      
      // Show confirmation to user
      const { Alert } = require('react-native');
      Alert.alert(
        'SMS App Opened',
        'Press the SEND button in your SMS app to send the emergency alert.',
        [{ text: 'OK' }]
      );
    } else {
      console.error('❌ Cannot open SMS app');
      console.error('   SMS URL might be malformed or SMS app not available');
      
      // Try simpler URL without body
      console.log('🔄 Trying simpler SMS URL without message...');
      const simpleSmsUrl = `sms:${phoneNumbers}`;
      const canOpenSimple = await Linking.canOpenURL(simpleSmsUrl);
      
      if (canOpenSimple) {
        console.log('📤 Opening SMS app with simple URL...');
        await Linking.openURL(simpleSmsUrl);
        console.log('✅ SMS app opened (you need to type the message manually)');
        
        const { Alert } = require('react-native');
        Alert.alert(
          'SMS App Opened',
          `Please type this message:\n\n${message}`,
          [{ text: 'OK' }]
        );
      } else {
        console.error('❌ Cannot open SMS app at all');
        
        const { Alert } = require('react-native');
        Alert.alert(
          'SMS Not Available',
          'Cannot open SMS app. Please share your location manually using the Share button.',
          [{ text: 'OK' }]
        );
      }
    }

    console.log('═══════════════════════════════════════');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('═══════════════════════════════════════');
    console.error('❌ NATIVE SMS ERROR');
    console.error('═══════════════════════════════════════');
    console.error('Error:', error);
    console.error('Error type:', typeof error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    console.error('═══════════════════════════════════════');
    console.error('');
    
    // Show error to user
    const { Alert } = require('react-native');
    Alert.alert(
      'SMS Error',
      'Failed to open SMS app. Please use the Share button to send your location manually.',
      [{ text: 'OK' }]
    );
  }
}

/**
 * Send SMS to individual contact (for live updates)
 */
export async function sendUpdateSMS(
  phoneNumber: string,
  message: string
): Promise<void> {
  try {
    let smsUrl: string;
    if (Platform.OS === 'android') {
      smsUrl = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;
    } else {
      smsUrl = `sms:${phoneNumber}&body=${encodeURIComponent(message)}`;
    }

    const canOpen = await Linking.canOpenURL(smsUrl);
    if (canOpen) {
      await Linking.openURL(smsUrl);
    }
  } catch (error) {
    console.error('❌ Failed to send update SMS:', error);
  }
}
