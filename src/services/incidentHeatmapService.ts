import { collection, query, onSnapshot, Timestamp, getDocs, where } from 'firebase/firestore';
import { db } from '../firebase';

export interface Incident {
  id: string;
  latitude: number;
  longitude: number;
  timestamp: Timestamp;
  type: 'kidnap' | 'assault' | 'emergency';
  userId: string;
  status: string;
}

export interface HeatmapPoint {
  latitude: number;
  longitude: number;
  weight: number;
  intensity: number;
}

/**
 * Subscribe to real-time incidents from Firestore
 */
export function subscribeToIncidents(callback: (incidents: Incident[]) => void) {
  console.log('🔥 Subscribing to incidents collection for heatmap...');
  
  const q = query(collection(db, 'incidents'));

  return onSnapshot(q, (snapshot) => {
    const incidents: Incident[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Incident));

    console.log(`🔥 Received ${incidents.length} incidents from Firestore`);
    console.log('📊 Incident types:', {
      kidnap: incidents.filter(i => i.type === 'kidnap').length,
      assault: incidents.filter(i => i.type === 'assault').length,
      emergency: incidents.filter(i => i.type === 'emergency').length
    });
    
    callback(incidents);
  }, (error) => {
    console.error('❌ Error subscribing to incidents:', error);
  });
}

/**
 * Convert incidents to heatmap points with clustering
 * Groups nearby incidents to show intensity
 */
export function convertToHeatmapPoints(incidents: Incident[]): HeatmapPoint[] {
  console.log('🗺️ Converting incidents to heatmap points...');
  
  if (incidents.length === 0) {
    console.log('ℹ️ No incidents to convert');
    return [];
  }

  // Group incidents by proximity (0.001 degrees ≈ 111 meters)
  const CLUSTER_THRESHOLD = 0.001;
  const clusters: Map<string, Incident[]> = new Map();

  incidents.forEach(incident => {
    // Round coordinates to create cluster key
    const clusterLat = Math.round(incident.latitude / CLUSTER_THRESHOLD) * CLUSTER_THRESHOLD;
    const clusterLng = Math.round(incident.longitude / CLUSTER_THRESHOLD) * CLUSTER_THRESHOLD;
    const key = `${clusterLat},${clusterLng}`;

    if (!clusters.has(key)) {
      clusters.set(key, []);
    }
    clusters.get(key)!.push(incident);
  });

  console.log(`📍 Created ${clusters.size} clusters from ${incidents.length} incidents`);

  // Convert clusters to heatmap points
  const heatmapPoints: HeatmapPoint[] = [];

  clusters.forEach((clusterIncidents, key) => {
    // Calculate average position
    const avgLat = clusterIncidents.reduce((sum, i) => sum + i.latitude, 0) / clusterIncidents.length;
    const avgLng = clusterIncidents.reduce((sum, i) => sum + i.longitude, 0) / clusterIncidents.length;

    // Calculate weight based on incident types
    let totalWeight = 0;
    clusterIncidents.forEach(incident => {
      if (incident.type === 'kidnap') totalWeight += 3;
      else if (incident.type === 'assault') totalWeight += 2;
      else totalWeight += 1;
    });

    // Calculate intensity (number of incidents)
    const intensity = clusterIncidents.length;

    heatmapPoints.push({
      latitude: avgLat,
      longitude: avgLng,
      weight: totalWeight,
      intensity: intensity
    });
  });

  // Sort by intensity (highest first)
  heatmapPoints.sort((a, b) => b.intensity - a.intensity);

  console.log('✅ Heatmap points created:', {
    total: heatmapPoints.length,
    maxIntensity: Math.max(...heatmapPoints.map(p => p.intensity)),
    maxWeight: Math.max(...heatmapPoints.map(p => p.weight))
  });

  return heatmapPoints;
}

/**
 * Get heatmap color based on weight and intensity
 */
export function getHeatmapColor(weight: number, intensity: number): string {
  // Base color on weight (incident severity) - DARKER COLORS
  let r = 255;
  let g = 0;
  let b = 0;

  if (weight >= 9) {
    // Very high severity - very dark red
    r = 100; g = 0; b = 0;
  } else if (weight >= 6) {
    // High severity - dark red
    r = 139; g = 0; b = 0;
  } else if (weight >= 3) {
    // Medium severity - red
    r = 200; g = 0; b = 0;
  } else {
    // Low severity - orange-red
    r = 255; g = 69; b = 0;
  }

  // Adjust opacity based on intensity (number of incidents) - HIGHER OPACITY
  const baseOpacity = 0.4;
  const maxOpacity = 0.8;
  const opacity = Math.min(maxOpacity, baseOpacity + (intensity * 0.15));

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Get heatmap radius based on intensity
 */
export function getHeatmapRadius(intensity: number): number {
  const baseRadius = 150;
  const maxRadius = 500;
  
  // Larger radius for more incidents
  return Math.min(maxRadius, baseRadius + (intensity * 50));
}

/**
 * Get recent incidents (last N hours)
 */
export async function getRecentIncidents(hoursBack: number = 24): Promise<Incident[]> {
  try {
    console.log(`📅 Fetching incidents from last ${hoursBack} hours...`);
    
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hoursBack);
    const cutoffTimestamp = Timestamp.fromDate(cutoffTime);

    const q = query(
      collection(db, 'incidents'),
      where('timestamp', '>=', cutoffTimestamp)
    );

    const snapshot = await getDocs(q);
    
    const incidents: Incident[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Incident));

    console.log(`✅ Found ${incidents.length} recent incidents`);
    return incidents;
  } catch (error) {
    console.error('❌ Failed to fetch recent incidents:', error);
    throw error;
  }
}
