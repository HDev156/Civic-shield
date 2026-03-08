/**
 * SOS Service with Safe Initialization
 * Prevents crashes if expo-location is unavailable
 */

import { collection, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db, auth, isFirebaseAvailable } from '../firebase';
import { sendEmergencySMS, isSMSFeatureAvailable, getEmergencyContacts } from './autoSMSService';
import { sendNativeSMS } from './nativeSMSService';
import { sendTextbeltSMS } from './textbeltSMSService';
import { startVoiceRecording, stopVoiceRecording, uploadRecordingToFirebase, isVoiceRecordingAvailable } from './voiceRecordingService';
import { startLocationTracking } from './locationService';
import { startLiveTracking, stopLiveTracking } from './liveTrackingService';

// Lazy load Location module
let Location: any = null;
let SMS: any = null;
let isAvailable = false;
let isSMSAvailable = false;

try {
  console.log('📍 Loading expo-location in sosService...');
  Location = require('expo-location');
  isAvailable = true;
  console.log('✅ expo-location loaded in sosService');
} catch (error) {
  console.warn('⚠️ expo-location not available in sosService');
}

try {
  SMS = require('expo-sms');
  isSMSAvailable = true;
} catch (error) {
  console.warn('⚠️ expo-sms not available in sosService');
}

export interface SOSOptions {
  autoSMS?: boolean;
  autoRecord?: boolean;
  stealthMode?: boolean;
}

/**
 * Enhanced SOS alert with automatic SMS, voice recording, and live tracking
 */
export async function sendEnhancedSOSAlert(
  type: 'kidnap' | 'assault' | 'emergency' = 'emergency',
  options: SOSOptions = {}
): Promise<{
  docId: string;
  latitude: number;
  longitude: number;
}> {
  if (!isAvailable || !Location) {
    throw new Error('Location services not available');
  }

  const { autoSMS = true, autoRecord = true, stealthMode = false } = options;

  console.log('');
  console.log('═══════════════════════════════════════');
  console.log('🚨 ENHANCED SOS TRIGGERED');
  console.log('═══════════════════════════════════════');
  console.log(`Type: ${type.toUpperCase()}`);
  console.log(`Auto SMS: ${autoSMS}`);
  console.log(`Auto Record: ${autoRecord}`);
  console.log(`Stealth Mode: ${stealthMode}`);
  console.log(`Time: ${new Date().toISOString()}`);

  try {
    // Get location (permission should already be granted)
    console.log('📍 Getting location...');
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Location permission denied');
    }

    console.log('✅ Location permission granted');
    console.log('📍 Fetching current position...');
    
    // Try to get location with timeout
    let location;
    try {
      // Try high accuracy first with 10 second timeout
      location = await Promise.race([
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Location timeout')), 10000)
        )
      ]);
    } catch (highAccuracyError) {
      console.warn('⚠️ High accuracy failed, trying balanced accuracy...');
      
      // Fallback to balanced accuracy
      try {
        location = await Promise.race([
          Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Location timeout')), 10000)
          )
        ]);
      } catch (balancedError) {
        console.warn('⚠️ Balanced accuracy failed, trying low accuracy...');
        
        // Last resort: low accuracy
        location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Low,
        });
      }
    }

    console.log('✅ Location:', {
      lat: location.coords.latitude,
      lng: location.coords.longitude,
      accuracy: `±${location.coords.accuracy}m`
    });

    const userId = auth?.currentUser?.uid || 'anonymous';

    // Save to Firebase (if available)
    console.log('💾 Saving to Firebase...');
    const incidentData = {
      userId,
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      timestamp: Timestamp.now(),
      status: 'SOS_TRIGGERED',
      type,
      accuracy: location.coords.accuracy,
      createdAt: new Date().toISOString(),
      stealthMode,
      recordingUrl: null as string | null,
      autoSMS,
      autoRecord,
      liveTrackingActive: true,
    };

    let docId = 'local_' + Date.now();
    
    if (isFirebaseAvailable && db) {
      try {
        const docRef = await addDoc(collection(db, 'incidents'), incidentData);
        await addDoc(collection(db, 'sos_alerts'), incidentData);
        docId = docRef.id;
        console.log(`✅ Saved to Firebase: incidents/${docRef.id}`);
      } catch (firebaseError) {
        console.error('⚠️ Firebase save failed (non-critical):', firebaseError);
        console.log('ℹ️ Continuing without Firebase');
      }
    } else {
      console.log('ℹ️ Firebase not available, using local ID');
    }

    // Auto-send SMS to emergency contacts
    // Use Textbelt API (free SMS service) unless stealth mode
    if (!stealthMode) {
      console.log('📱 Sending SMS via Textbelt API...');
      console.log(`   autoSMS setting: ${autoSMS}`);
      try {
        // Use Textbelt SMS (free tier - 1 SMS per day per number)
        await sendTextbeltSMS(
          location.coords.latitude,
          location.coords.longitude,
          type
        );
        console.log('✅ Textbelt SMS request completed');
      } catch (error) {
        console.error('❌ Textbelt SMS failed:', error);
        console.error('   Error details:', error);
        
        // Fallback to native SMS app
        console.log('🔄 Falling back to native SMS app...');
        try {
          await sendNativeSMS(
            location.coords.latitude,
            location.coords.longitude,
            type
          );
        } catch (nativeError) {
          console.error('❌ Native SMS also failed:', nativeError);
        }
      }
    } else {
      console.log('🤫 Stealth mode: SMS skipped');
    }

    // Start live location tracking (sends updates every 30 seconds)
    if (autoSMS && !stealthMode) {
      console.log('🔄 Starting live location tracking...');
      try {
        await startLiveTracking();
        console.log('✅ Live tracking started - updates every 30s');
      } catch (error) {
        console.error('❌ Live tracking failed:', error);
      }
    }

    // Start voice recording
    if (autoRecord) {
      if (isVoiceRecordingAvailable()) {
        console.log('🎤 Starting 60s voice recording...');
        try {
          await startVoiceRecording(60000);
          console.log('✅ Recording started');

          // Upload and send link after 60 seconds
          setTimeout(async () => {
            try {
              const uri = await stopVoiceRecording();
              if (uri) {
                console.log('☁️ Uploading recording...');
                const downloadURL = await uploadRecordingToFirebase(uri, docRef.id);
                
                // Update Firebase
                await updateDoc(doc(db, 'incidents', docRef.id), {
                  recordingUrl: downloadURL
                });
                console.log('✅ Recording uploaded:', downloadURL);

                // Send recording link to contacts via SMS
                if (autoSMS && !stealthMode && isSMSAvailable && SMS) {
                  try {
                    const contacts = await getEmergencyContacts();
                    if (contacts.length > 0) {
                      const phoneNumbers = contacts.map(c => c.phone);
                      const message = `🎤 Voice Recording Available

Emergency recording from Civic Shield:
${downloadURL}

Time: ${new Date().toLocaleTimeString()}

Listen to this recording for evidence.`;

                      await SMS.sendSMSAsync(phoneNumbers, message);
                      console.log('✅ Recording link sent to contacts');
                    }
                  } catch (error) {
                    console.error('❌ Failed to send recording link:', error);
                  }
                }
              }
            } catch (error) {
              console.error('❌ Upload failed:', error);
            }
          }, 60000);
        } catch (error) {
          console.error('❌ Recording failed:', error);
        }
      } else {
        console.log('ℹ️ Recording skipped - not available');
      }
    }

    // Start background location tracking
    console.log('🔄 Starting background location tracking...');
    await startLocationTracking();

    console.log('');
    console.log('✅ ENHANCED SOS COMPLETED');
    console.log('═══════════════════════════════════════');
    console.log('');

    return {
      docId: docId,
      latitude: location.coords.latitude,
      longitude: location.coords.longitude
    };
  } catch (error: any) {
    console.error('');
    console.error('❌ SOS ERROR:', error.message || error);
    console.error('Error details:', error);
    console.error('');
    
    // Provide helpful error message
    let errorMessage = 'Failed to send SOS alert. ';
    
    if (error.message && error.message.includes('Location')) {
      errorMessage = 'Unable to get your location. Please make sure:\n\n' +
        '1. Location/GPS is turned ON\n' +
        '2. You are not indoors (try going near a window)\n' +
        '3. Location permission is granted\n\n' +
        'Try again in a few seconds.';
    } else if (error.message && error.message.includes('timeout')) {
      errorMessage = 'Location request timed out. Please:\n\n' +
        '1. Make sure GPS is enabled\n' +
        '2. Go to an open area if possible\n' +
        '3. Try again';
    } else {
      errorMessage += error.message || 'Unknown error occurred.';
    }
    
    throw new Error(errorMessage);
  }
}

/**
 * Stop all SOS tracking
 */
export function stopSOSTracking(): void {
  console.log('🛑 Stopping all SOS tracking...');
  stopLiveTracking();
  console.log('✅ SOS tracking stopped');
}
