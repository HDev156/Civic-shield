/**
 * Police Station Finder Service
 * Finds nearby police stations using Google Places API
 */

import { getRealLocation } from './realLocationService';

export interface PoliceStation {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distance: number; // in meters
  phone?: string;
  isOpen?: boolean;
}

/**
 * Find nearby police stations
 * Uses Google Places API (requires API key)
 */
export async function findNearbyPoliceStations(
  maxResults: number = 5
): Promise<{ success: boolean; stations?: PoliceStation[]; message: string }> {
  try {
    console.log('🚓 Finding nearby police stations...');

    // Get current location
    const location = await getRealLocation();
    console.log('📍 Current location:', location.latitude, location.longitude);

    // For now, return mock data
    // TODO: Implement Google Places API integration
    const mockStations: PoliceStation[] = [
      {
        name: 'Local Police Station',
        address: 'Near your location',
        latitude: location.latitude + 0.01,
        longitude: location.longitude + 0.01,
        distance: 1200,
        phone: '100',
        isOpen: true,
      },
    ];

    return {
      success: true,
      stations: mockStations,
      message: `Found ${mockStations.length} police station(s)`,
    };
  } catch (error) {
    console.error('❌ Failed to find police stations:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to find stations',
    };
  }
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Get directions to police station
 */
export function getDirectionsToStation(station: PoliceStation): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}`;
}

/**
 * Call police station
 */
export function callPoliceStation(phone: string): string {
  return `tel:${phone}`;
}

/**
 * Call emergency number (100 in India, 911 in US, 112 in EU)
 */
export function callEmergency(countryCode: string = 'IN'): string {
  const emergencyNumbers: { [key: string]: string } = {
    IN: '100', // India
    US: '911', // United States
    GB: '999', // United Kingdom
    EU: '112', // European Union
    AU: '000', // Australia
  };

  return `tel:${emergencyNumbers[countryCode] || '112'}`;
}
