/**
 * Live Location Tracking Service
 * Sends location updates to Firebase (Cloud Functions will send SMS automatically)
 */

import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { getEmergencyContacts } from './autoSMSService';

let Location: any = null;
let isLocationAvailable = false;
let trackingInterval: NodeJS.Timeout | null = null;
let updateCount = 0;

// Safe module loading
try {
  Location = require('expo-location');
  isLocationAvailable = true;
  console.log('✅ expo-location loaded for live tracking');
} catch (error) {
  console.warn('⚠️ expo-location not available for live tracking');
}

/**
 * Start sending location updates every 30 seconds
 * Updates are saved to Firebase, Cloud Functions will send SMS automatically
 */
export async function startLiveTracking(): Promise<void> {
  if (!isLocationAvailable || !Location) {
    console.log('⚠️ Live tracking not available - location module not loaded');
    return;
  }

  // Stop any existing tracking
  stopLiveTracking();

  console.log('');
  console.log('🔄 STARTING LIVE LOCATION TRACKING');
  console.log('Updates will be sent every 30 seconds via Cloud Functions');
  console.log('');

  updateCount = 0;
  const userId = auth.currentUser?.uid || 'anonymous';

  // Send updates every 30 seconds
  trackingInterval = setInterval(async () => {
    try {
      updateCount++;
      console.log(`📍 Sending location update #${updateCount}...`);

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude, accuracy } = location.coords;

      // Save to Firebase - Cloud Function will automatically send SMS
      await addDoc(collection(db, 'location_updates'), {
        userId,
        latitude,
        longitude,
        accuracy,
        timestamp: Timestamp.now(),
        updateNumber: updateCount,
        createdAt: new Date().toISOString()
      });

      console.log(`✅ Update #${updateCount} saved to Firebase`);
      console.log(`   Location: ${latitude}, ${longitude}`);
      console.log(`   Accuracy: ±${Math.round(accuracy)}m`);
      console.log(`   Cloud Function will send SMS automatically`);

    } catch (error) {
      console.error(`❌ Failed to send update #${updateCount}:`, error);
    }
  }, 30000); // 30 seconds

  console.log('✅ Live tracking started');
}

/**
 * Stop sending location updates
 */
export function stopLiveTracking(): void {
  if (trackingInterval) {
    clearInterval(trackingInterval);
    trackingInterval = null;
    console.log('');
    console.log(`🛑 LIVE TRACKING STOPPED`);
    console.log(`Total updates sent: ${updateCount}`);
    console.log('');
    updateCount = 0;
  }
}

/**
 * Check if live tracking is currently active
 */
export function isLiveTrackingActive(): boolean {
  return trackingInterval !== null;
}

/**
 * Get the number of updates sent
 */
export function getUpdateCount(): number {
  return updateCount;
}
