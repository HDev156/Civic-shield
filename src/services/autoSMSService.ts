/**
 * Auto SMS Service with Safe Initialization
 * Prevents crashes if expo-sms is unavailable
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';

let SMS: any = null;
let isAvailable = false;

// Safe module loading with try-catch
try {
  console.log('📱 Loading expo-sms...');
  SMS = require('expo-sms');
  isAvailable = true;
  console.log('✅ expo-sms loaded successfully');
} catch (error) {
  console.warn('⚠️ expo-sms not available:', error);
  console.log('ℹ️ Auto SMS will be disabled');
}

const EMERGENCY_CONTACTS_KEY = 'emergency_contacts';

export interface EmergencyContact {
  name: string;
  phone: string;
}

export function isSMSFeatureAvailable(): boolean {
  return isAvailable;
}

/**
 * Save emergency contacts to AsyncStorage (and optionally Firebase)
 * AsyncStorage is the primary storage for release builds
 */
export async function saveEmergencyContacts(contacts: EmergencyContact[]): Promise<void> {
  try {
    // Save to AsyncStorage (primary storage)
    await AsyncStorage.setItem(EMERGENCY_CONTACTS_KEY, JSON.stringify(contacts));
    console.log('✅ Emergency contacts saved to AsyncStorage:', contacts.length);
    
    // Try to save to Firebase (optional, for Cloud Functions)
    // Don't fail if Firebase is not available
    try {
      const userId = auth.currentUser?.uid;
      if (userId && userId !== 'anonymous') {
        // Clear existing contacts
        const contactsRef = collection(db, 'users', userId, 'emergency_contacts');
        const snapshot = await getDocs(contactsRef);
        await Promise.all(snapshot.docs.map(doc => deleteDoc(doc.ref)));
        
        // Add new contacts
        await Promise.all(
          contacts.map((contact, index) =>
            setDoc(doc(db, 'users', userId, 'emergency_contacts', `contact_${index}`), {
              name: contact.name,
              phone: contact.phone,
              addedAt: new Date().toISOString()
            })
          )
        );
        console.log('✅ Emergency contacts also saved to Firebase');
      } else {
        console.log('ℹ️ Skipping Firebase save (user not authenticated)');
      }
    } catch (firebaseError) {
      console.warn('⚠️ Failed to save to Firebase (non-critical):', firebaseError);
      // Don't throw - AsyncStorage save succeeded
    }
  } catch (error) {
    console.error('❌ Failed to save emergency contacts:', error);
    throw error;
  }
}

/**
 * Get emergency contacts from AsyncStorage (primary storage)
 * Falls back to Firebase if needed (for Cloud Functions setup)
 */
export async function getEmergencyContacts(): Promise<EmergencyContact[]> {
  try {
    // Try AsyncStorage first (primary storage for release builds)
    const data = await AsyncStorage.getItem(EMERGENCY_CONTACTS_KEY);
    if (data) {
      const contacts = JSON.parse(data);
      console.log('📱 Retrieved emergency contacts from AsyncStorage:', contacts.length);
      return contacts;
    }
    
    // Fallback to Firebase (only if AsyncStorage is empty)
    try {
      const userId = auth.currentUser?.uid;
      if (userId && userId !== 'anonymous') {
        const contactsRef = collection(db, 'users', userId, 'emergency_contacts');
        const snapshot = await getDocs(contactsRef);
        
        const contacts = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            name: data.name,
            phone: data.phone
          };
        });
        
        if (contacts.length > 0) {
          console.log('📱 Retrieved emergency contacts from Firebase:', contacts.length);
          
          // Save to AsyncStorage for next time
          await AsyncStorage.setItem(EMERGENCY_CONTACTS_KEY, JSON.stringify(contacts));
          
          return contacts;
        }
      }
    } catch (firebaseError) {
      console.warn('⚠️ Failed to get from Firebase (non-critical):', firebaseError);
    }
    
    console.log('📱 No emergency contacts found');
    return [];
  } catch (error) {
    console.error('❌ Failed to get emergency contacts:', error);
    return [];
  }
}

export async function sendEmergencySMS(
  latitude: number,
  longitude: number,
  incidentType: string
): Promise<void> {
  if (!isAvailable || !SMS) {
    console.log('⚠️ SMS not available - module not loaded');
    console.log('ℹ️ Use manual share button instead');
    return;
  }

  try {
    console.log('📤 Preparing to send emergency SMS...');

    // Check if SMS is available on device
    const isDeviceAvailable = await SMS.isAvailableAsync();
    if (!isDeviceAvailable) {
      console.warn('⚠️ SMS not available on this device');
      return;
    }

    const contacts = await getEmergencyContacts();
    if (contacts.length === 0) {
      console.warn('⚠️ No emergency contacts configured');
      return;
    }

    const phoneNumbers = contacts.map((c: EmergencyContact) => c.phone);
    const mapsLink = `https://maps.google.com/?q=${latitude},${longitude}`;
    
    const message = `🚨 EMERGENCY ALERT

I may be in danger. My live location:
${mapsLink}

Type: ${incidentType.toUpperCase()}
Time: ${new Date().toLocaleString()}

Sent from Civic Shield`;

    console.log('📱 Sending SMS to:', phoneNumbers);

    const { result } = await SMS.sendSMSAsync(phoneNumbers, message);
    
    if (result === 'sent') {
      console.log('✅ Emergency SMS sent successfully');
    } else {
      console.log('ℹ️ SMS result:', result);
    }
  } catch (error) {
    console.error('❌ Failed to send emergency SMS:', error);
    // Don't throw - app should continue working
  }
}
