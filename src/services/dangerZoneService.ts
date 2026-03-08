/**
 * Danger Zone Detection Service with Safe Initialization
 */

import { collection, query, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

// Lazy load Location module
let Location: any = null;
let isAvailable = false;

try {
  console.log('📍 Loading expo-location in dangerZoneService...');
  Location = require('expo-location');
  isAvailable = true;
  console.log('✅ expo-location loaded in dangerZoneService');
} catch (error) {
  console.warn('⚠️ expo-location not available in dangerZoneService');
}

export interface NearbyDanger {
  count: number;
  incidents: Array<{
    id: string;
    type: string;
    distance: number;
    timestamp: Timestamp;
  }>;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Check for nearby danger incidents within specified radius
 * @param userLocation - User's current location
 * @param radiusKm - Search radius in kilometers (default: 1km)
 * @param hoursBack - How many hours back to check (default: 24)
 */
export async function checkNearbyDanger(
  userLocation: Location.LocationObject,
  radiusKm: number = 1,
  hoursBack: number = 24
): Promise<NearbyDanger> {
  try {
    console.log('🔍 Checking for nearby danger...');
    console.log(`📍 User location: ${userLocation.coords.latitude}, ${userLocation.coords.longitude}`);
    console.log(`🎯 Search radius: ${radiusKm}km`);

    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hoursBack);
    const cutoffTimestamp = Timestamp.fromDate(cutoffTime);

    // Fetch recent SOS alerts
    const q = query(collection(db, 'sos_alerts'));
    const snapshot = await getDocs(q);

    const nearbyIncidents: NearbyDanger['incidents'] = [];

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      
      // Check if incident is recent
      if (data.timestamp && data.timestamp.toMillis() < cutoffTimestamp.toMillis()) {
        return;
      }

      // Calculate distance
      const distance = calculateDistance(
        userLocation.coords.latitude,
        userLocation.coords.longitude,
        data.latitude,
        data.longitude
      );

      // If within radius, add to nearby incidents
      if (distance <= radiusKm) {
        nearbyIncidents.push({
          id: doc.id,
          type: data.type || 'emergency',
          distance: parseFloat(distance.toFixed(2)),
          timestamp: data.timestamp
        });
      }
    });

    // Sort by distance
    nearbyIncidents.sort((a, b) => a.distance - b.distance);

    if (nearbyIncidents.length > 0) {
      console.log(`⚠️ Nearby danger detected: ${nearbyIncidents.length} incidents within ${radiusKm}km`);
      nearbyIncidents.forEach(incident => {
        console.log(`  - ${incident.type} at ${incident.distance}km away`);
      });
    } else {
      console.log('✅ No nearby danger detected');
    }

    return {
      count: nearbyIncidents.length,
      incidents: nearbyIncidents
    };
  } catch (error) {
    console.error('❌ Failed to check nearby danger:', error);
    throw error;
  }
}

/**
 * Get danger level description based on incident count
 */
export function getDangerLevel(count: number): {
  level: 'safe' | 'low' | 'medium' | 'high';
  color: string;
  message: string;
} {
  if (count === 0) {
    return {
      level: 'safe',
      color: '#4CAF50',
      message: 'Area appears safe'
    };
  } else if (count <= 2) {
    return {
      level: 'low',
      color: '#FFC107',
      message: 'Low risk area'
    };
  } else if (count <= 5) {
    return {
      level: 'medium',
      color: '#FF9800',
      message: 'Moderate risk area'
    };
  } else {
    return {
      level: 'high',
      color: '#F44336',
      message: 'High risk area - Stay alert!'
    };
  }
}
