import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

export interface HeatmapPoint {
  latitude: number;
  longitude: number;
  weight?: number;
}

export interface SOSAlertWithType {
  id: string;
  latitude: number;
  longitude: number;
  timestamp: Timestamp;
  type: 'kidnap' | 'assault' | 'emergency';
  userId: string;
  status: string;
}

/**
 * Fetch SOS alerts for heatmap visualization
 * @param hoursBack - How many hours back to fetch alerts (default: 24)
 */
export async function fetchHeatmapData(hoursBack: number = 24): Promise<HeatmapPoint[]> {
  try {
    console.log(`🔥 Fetching heatmap data (last ${hoursBack} hours)...`);

    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hoursBack);
    const cutoffTimestamp = Timestamp.fromDate(cutoffTime);

    const q = query(
      collection(db, 'sos_alerts'),
      where('timestamp', '>=', cutoffTimestamp)
    );

    const snapshot = await getDocs(q);
    
    const heatmapPoints: HeatmapPoint[] = snapshot.docs.map(doc => {
      const data = doc.data();
      
      // Assign weight based on incident type
      let weight = 1;
      if (data.type === 'kidnap') weight = 3;
      else if (data.type === 'assault') weight = 2;
      else if (data.type === 'emergency') weight = 1;

      return {
        latitude: data.latitude,
        longitude: data.longitude,
        weight
      };
    });

    console.log(`✅ Heatmap loaded: ${heatmapPoints.length} points`);
    console.log('🔥 Heatmap data ready for visualization');

    return heatmapPoints;
  } catch (error) {
    console.error('❌ Failed to fetch heatmap data:', error);
    throw error;
  }
}

/**
 * Get all SOS alerts with full details
 */
export async function fetchAllSOSAlerts(): Promise<SOSAlertWithType[]> {
  try {
    const snapshot = await getDocs(collection(db, 'sos_alerts'));
    
    const alerts: SOSAlertWithType[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as SOSAlertWithType));

    console.log(`📊 Fetched ${alerts.length} SOS alerts`);
    return alerts;
  } catch (error) {
    console.error('❌ Failed to fetch SOS alerts:', error);
    throw error;
  }
}
