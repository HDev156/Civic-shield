/**
 * Location Service with Safe Initialization
 * Prevents crashes if expo-location is unavailable
 */

import { collection, addDoc, setDoc, doc, Timestamp, query, where, onSnapshot, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Share } from 'react-native';
import { sendEmergencySMS } from './autoSMSService';
import { startVoiceRecording, stopVoiceRecording, uploadRecordingToFirebase } from './voiceRecordingService';

let Location: any = null;
let isAvailable = false;

// Safe module loading with try-catch
try {
  console.log('📍 Loading expo-location...');
  Location = require('expo-location');
  isAvailable = true;
  console.log('✅ expo-location loaded successfully');
} catch (error) {
  console.error('❌ expo-location not available:', error);
  console.log('ℹ️ Location services will be disabled');
}

export interface SOSAlert {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  timestamp: Timestamp;
  status: string;
  type?: 'kidnap' | 'assault' | 'emergency';
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  timestamp: Timestamp;
  userId: string;
}

let locationSubscription: any = null;

export function isLocationAvailable(): boolean {
  return isAvailable && Location !== null;
}

/**
 * Get current GPS location with safe permission handling
 */
export async function getCurrentLocation(): Promise<any> {
  if (!isAvailable || !Location) {
    console.error('❌ Location module not available');
    throw new Error('Location services not available');
  }

  try {
    console.log('📍 Requesting location permission...');
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      console.error('❌ Location permission denied');
      throw new Error('Location permission denied');
    }

    console.log('✅ Location permission granted');
    console.log('📍 Fetching current location...');

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    console.log('✅ Location fetched:', {
      lat: location.coords.latitude,
      lng: location.coords.longitude,
      accuracy: location.coords.accuracy
    });

    return location;
  } catch (error) {
    console.error('❌ Failed to get location:', error);
    throw error;
  }
}

/**
 * Share SOS alert via device share API
 */
async function shareSOSLocation(latitude: number, longitude: number): Promise<void> {
  try {
    const googleMapsLink = `https://maps.google.com/?q=${latitude},${longitude}`;
    
    const message = `🚨 SOS ALERT

I might be in danger.

Live location:
${googleMapsLink}

Sent from Civic Shield`;

    console.log('📤 Sharing SOS location...');
    
    const result = await Share.share({
      message: message,
      title: '🚨 Emergency SOS Alert'
    });

    if (result.action === Share.sharedAction) {
      console.log('✅ SOS shared successfully');
      if (result.activityType) {
        console.log(`Shared via: ${result.activityType}`);
      }
    } else if (result.action === Share.dismissedAction) {
      console.log('ℹ️ Share dismissed by user');
    }
  } catch (error) {
    console.error('❌ Failed to share SOS:', error);
    throw error;
  }
}

/**
 * Send SOS alert to Firestore with auto-sharing and comprehensive debugging
 */
export async function sendSOSAlert(type: 'kidnap' | 'assault' | 'emergency' = 'emergency'): Promise<{
  docId: string;
  latitude: number;
  longitude: number;
}> {
  console.log('');
  console.log('═══════════════════════════════════════');
  console.log('🚨 SOS TRIGGERED');
  console.log('═══════════════════════════════════════');
  console.log(`Incident Type: ${type.toUpperCase()}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  
  try {
    // Step 1: Get current location
    console.log('');
    console.log('📍 STEP 1: Fetching GPS Location...');
    const location = await getCurrentLocation();
    
    console.log('✅ Location fetched successfully!');
    console.log('Coordinates:', {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: `±${location.coords.accuracy}m`,
      altitude: location.coords.altitude,
      timestamp: new Date(location.timestamp).toISOString()
    });
    
    // Step 2: Get user ID
    console.log('');
    console.log('👤 STEP 2: Getting User ID...');
    const userId = auth.currentUser?.uid || 'anonymous';
    console.log(`User ID: ${userId}`);
    console.log(`Auth Status: ${auth.currentUser ? 'Authenticated' : 'Anonymous'}`);

    // Step 3: Prepare incident data
    console.log('');
    console.log('📦 STEP 3: Preparing Incident Data...');
    const incidentData = {
      userId,
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      timestamp: Timestamp.now(),
      status: 'SOS_TRIGGERED',
      type,
      accuracy: location.coords.accuracy,
      createdAt: new Date().toISOString()
    };
    
    console.log('Incident Data:', JSON.stringify(incidentData, null, 2));

    // Step 4: Save to Firebase
    console.log('');
    console.log('💾 STEP 4: Saving to Firebase Firestore...');
    console.log('Collection: incidents');
    
    const docRef = await addDoc(collection(db, 'incidents'), incidentData);

    console.log('');
    console.log('✅ FIREBASE SUCCESS!');
    console.log(`Document ID: ${docRef.id}`);
    console.log(`Collection: incidents`);
    console.log(`Path: incidents/${docRef.id}`);

    // Step 5: Also save to sos_alerts for backward compatibility
    console.log('');
    console.log('💾 STEP 5: Saving to sos_alerts collection...');
    const sosDocRef = await addDoc(collection(db, 'sos_alerts'), incidentData);
    console.log(`✅ Also saved to sos_alerts/${sosDocRef.id}`);

    // Step 6: Generate Google Maps link
    console.log('');
    console.log('🗺️ STEP 6: Generating Google Maps Link...');
    const mapsLink = `https://maps.google.com/?q=${location.coords.latitude},${location.coords.longitude}`;
    console.log(`Maps Link: ${mapsLink}`);

    // Step 7: Start live location tracking
    console.log('');
    console.log('🔄 STEP 7: Starting Live Location Tracking...');
    await startLocationTracking();

    console.log('');
    console.log('═══════════════════════════════════════');
    console.log('✅ SOS ALERT COMPLETED SUCCESSFULLY');
    console.log('═══════════════════════════════════════');
    console.log('');

    return {
      docId: docRef.id,
      latitude: location.coords.latitude,
      longitude: location.coords.longitude
    };
  } catch (error: any) {
    console.log('');
    console.log('═══════════════════════════════════════');
    console.log('❌ FIREBASE ERROR');
    console.log('═══════════════════════════════════════');
    console.error('Error Type:', error.constructor.name);
    console.error('Error Code:', error.code || 'N/A');
    console.error('Error Message:', error.message);
    console.error('Full Error:', error);
    console.log('═══════════════════════════════════════');
    console.log('');
    throw error;
  }
}

/**
 * Start live location tracking (updates every 5 seconds)
 */
export async function startLocationTracking(): Promise<void> {
  if (!isAvailable || !Location) {
    console.log('⚠️ Location tracking not available - module not loaded');
    return;
  }

  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      console.error('Location permission denied for tracking');
      return;
    }

    // Stop existing subscription if any
    if (locationSubscription) {
      locationSubscription.remove();
    }

    console.log('🔄 Starting live location tracking (every 5 seconds)...');

    locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000, // 5 seconds
        distanceInterval: 10, // 10 meters
      },
      async (location) => {
        try {
          const userId = auth.currentUser?.uid || 'anonymous';

          const locationData: UserLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            timestamp: Timestamp.now(),
            userId
          };

          console.log('📍 Location updated:', {
            lat: locationData.latitude,
            lng: locationData.longitude,
            time: new Date().toLocaleTimeString()
          });

          // Save to Firestore (using setDoc to update same document)
          await setDoc(doc(db, 'user_locations', userId), locationData);

          console.log('✅ Location saved to Firestore');
        } catch (error) {
          console.error('❌ Failed to save location:', error);
        }
      }
    );

    console.log('✅ Location tracking started');
  } catch (error) {
    console.error('❌ Failed to start location tracking:', error);
    throw error;
  }
}

/**
 * Stop live location tracking
 */
export function stopLocationTracking(): void {
  if (locationSubscription) {
    locationSubscription.remove();
    locationSubscription = null;
    console.log('🛑 Location tracking stopped');
  }
}

/**
 * Subscribe to SOS alerts from Firestore
 */
export function subscribeToSOSAlerts(callback: (alerts: SOSAlert[]) => void) {
  const q = query(
    collection(db, 'sos_alerts'),
    where('status', '==', 'SOS_TRIGGERED')
  );

  console.log('👂 Subscribing to SOS alerts...');

  return onSnapshot(q, (snapshot) => {
    const alerts: SOSAlert[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as SOSAlert));

    console.log(`📡 Received ${alerts.length} SOS alerts from Firestore`);
    callback(alerts);
  }, (error) => {
    console.error('❌ Error subscribing to SOS alerts:', error);
  });
}
