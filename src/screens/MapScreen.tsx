import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, Alert, ActivityIndicator, Vibration } from 'react-native';
import MapView, { Marker, Circle, PROVIDER_DEFAULT } from 'react-native-maps';
import { startLocationTracking, stopLocationTracking, isLocationAvailable } from '../services/locationService';
import { 
  subscribeToIncidents, 
  convertToHeatmapPoints, 
  getHeatmapColor, 
  getHeatmapRadius,
  Incident,
  HeatmapPoint 
} from '../services/incidentHeatmapService';
import { checkNearbyDanger, getDangerLevel } from '../services/dangerZoneService';

// Lazy load Location module
let Location: any = null;
try {
  Location = require('expo-location');
} catch (error) {
  console.warn('⚠️ expo-location not available in MapScreen');
}

export default function MapScreen() {
  const [location, setLocation] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [heatmapPoints, setHeatmapPoints] = useState<HeatmapPoint[]>([]);
  const [nearbyDangerCount, setNearbyDangerCount] = useState<number>(0);
  const [isInDangerZone, setIsInDangerZone] = useState<boolean>(false);
  const [dangerZoneCenter, setDangerZoneCenter] = useState<{ latitude: number; longitude: number } | null>(null);
  const mapRef = useRef<MapView>(null);
  const lastAlertTime = useRef<number>(0);
  const ALERT_COOLDOWN = 30000; // 30 seconds between alerts

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Real-time danger detection
  const detectDangerZone = async (userLocation: Location.LocationObject, allIncidents: Incident[]) => {
    try {
      console.log('');
      console.log('🔍 REAL-TIME DANGER DETECTION');
      console.log('═══════════════════════════════════════');
      console.log(`User Location: ${userLocation.coords.latitude.toFixed(6)}, ${userLocation.coords.longitude.toFixed(6)}`);
      console.log(`Total Incidents: ${allIncidents.length}`);

      // Find incidents within 1km
      const nearbyIncidents = allIncidents.filter(incident => {
        const distance = calculateDistance(
          userLocation.coords.latitude,
          userLocation.coords.longitude,
          incident.latitude,
          incident.longitude
        );
        return distance <= 1; // 1km radius
      });

      console.log(`📍 Nearby Incidents (within 1km): ${nearbyIncidents.length}`);
      
      if (nearbyIncidents.length > 0) {
        nearbyIncidents.forEach((incident, index) => {
          const distance = calculateDistance(
            userLocation.coords.latitude,
            userLocation.coords.longitude,
            incident.latitude,
            incident.longitude
          );
          console.log(`  ${index + 1}. ${incident.type} - ${(distance * 1000).toFixed(0)}m away`);
        });
      }

      setNearbyDangerCount(nearbyIncidents.length);

      // HIGH RISK THRESHOLD: More than 3 incidents
      if (nearbyIncidents.length > 3) {
        console.log('');
        console.log('⚠️ HIGH RISK AREA DETECTED!');
        console.log(`Incident Count: ${nearbyIncidents.length} (Threshold: 3)`);

        // Calculate center of danger zone (average of nearby incidents)
        const avgLat = nearbyIncidents.reduce((sum, i) => sum + i.latitude, 0) / nearbyIncidents.length;
        const avgLng = nearbyIncidents.reduce((sum, i) => sum + i.longitude, 0) / nearbyIncidents.length;
        
        setDangerZoneCenter({ latitude: avgLat, longitude: avgLng });

        // Only alert if not already in danger zone or cooldown expired
        const now = Date.now();
        if (!isInDangerZone || (now - lastAlertTime.current) > ALERT_COOLDOWN) {
          console.log('🚨 Triggering danger alert...');
          
          // Vibration pattern: [wait, vibrate, wait, vibrate]
          Vibration.vibrate([0, 500, 200, 500, 200, 500]);
          console.log('📳 Vibration triggered');

          const dangerInfo = getDangerLevel(nearbyIncidents.length);
          
          Alert.alert(
            '⚠️ You are entering a high-risk area',
            `${nearbyIncidents.length} incidents reported within 1km\n\n${dangerInfo.message}\n\nStay alert and consider changing your route.`,
            [
              { 
                text: 'OK', 
                style: 'default',
                onPress: () => {
                  console.log('User acknowledged danger alert');
                }
              }
            ]
          );

          lastAlertTime.current = now;
          setIsInDangerZone(true);
          console.log('✅ Alert displayed to user');
        } else {
          console.log('ℹ️ Alert suppressed (cooldown active or already in zone)');
        }
      } else {
        if (isInDangerZone) {
          console.log('✅ User has left the danger zone');
          setIsInDangerZone(false);
        }
        setDangerZoneCenter(null);
      }

      console.log('═══════════════════════════════════════');
      console.log('');
    } catch (error) {
      console.error('❌ Error in danger detection:', error);
    }
  };

  useEffect(() => {
    let mounted = true;
    let unsubscribeIncidents: (() => void) | null = null;
    let locationWatchSubscription: Location.LocationSubscription | null = null;
    let currentIncidents: Incident[] = [];

    (async () => {
      try {
        console.log('🗺️ MapScreen: Requesting location permission...');
        const { status } = await Location.requestForegroundPermissionsAsync();
        console.log('🗺️ MapScreen: Permission status:', status);
        
        if (status !== 'granted') {
          if (mounted) {
            setError('Location permission denied');
            setLoading(false);
          }
          Alert.alert(
            'Location Permission Required',
            'Please enable location permissions to use the map feature.'
          );
          return;
        }

        // Get initial location
        console.log('🗺️ MapScreen: Getting initial position...');
        const initialLoc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        console.log('🗺️ MapScreen: Initial location received:', initialLoc.coords);
        
        if (mounted) {
          setLocation(initialLoc);
          setLoading(false);
        }

        // Start live location tracking (every 5 seconds)
        await startLocationTracking();

        // Subscribe to incidents for real-time heatmap updates
        unsubscribeIncidents = subscribeToIncidents((newIncidents) => {
          if (mounted) {
            console.log('🗺️ MapScreen: Updating incidents and heatmap');
            currentIncidents = newIncidents; // Store in local variable
            setIncidents(newIncidents);
            
            // Convert incidents to heatmap points
            const points = convertToHeatmapPoints(newIncidents);
            setHeatmapPoints(points);
            
            console.log('🔥 Heatmap updated with', points.length, 'points');
          }
        });

        // Watch location for map updates AND danger detection
        console.log('🗺️ MapScreen: Starting real-time location monitoring...');
        locationWatchSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000, // Check every 5 seconds
            distanceInterval: 50, // Or when moved 50 meters
          },
          (newLocation) => {
            if (mounted) {
              console.log('📍 Location updated:', {
                lat: newLocation.coords.latitude.toFixed(6),
                lng: newLocation.coords.longitude.toFixed(6),
                time: new Date().toLocaleTimeString()
              });

              setLocation(newLocation);
              
              // Animate map to new location
              mapRef.current?.animateToRegion({
                latitude: newLocation.coords.latitude,
                longitude: newLocation.coords.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }, 1000);

              // Real-time danger detection using local incidents variable
              detectDangerZone(newLocation, currentIncidents);
            }
          }
        );

        console.log('✅ Real-time danger monitoring active');
        
      } catch (err) {
        console.error('🗺️ MapScreen: Location error:', err);
        if (mounted) {
          setError('Unable to get location');
          setLoading(false);
        }
        Alert.alert('Error', 'Unable to get your location. Please check location settings.');
      }
    })();

    return () => {
      mounted = false;
      stopLocationTracking();
      if (unsubscribeIncidents) {
        unsubscribeIncidents();
      }
      if (locationWatchSubscription) {
        locationWatchSubscription.remove();
      }
    };
  }, []); // Empty dependency array - only run once

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  if (error || !location) {
    return (
      <View style={styles.loading}>
        <Text style={styles.errorText}>📍 {error || 'Location unavailable'}</Text>
        <Text style={styles.errorSubtext}>
          {error === 'Location permission denied' 
            ? 'Enable location access in settings to use this feature'
            : 'Please check your location settings and try again'}
        </Text>
      </View>
    );
  }

  const region = {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  const dangerInfo = getDangerLevel(nearbyDangerCount);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={region}
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        loadingEnabled={true}
        followsUserLocation={true}
      >
        {/* Crime Heatmap Layer - Rendered first (behind markers) */}
        {heatmapPoints.map((point, index) => (
          <Circle
            key={`heatmap-${index}`}
            center={{
              latitude: point.latitude,
              longitude: point.longitude,
            }}
            radius={getHeatmapRadius(point.intensity)}
            fillColor={getHeatmapColor(point.weight, point.intensity)}
            strokeColor="rgba(255, 0, 0, 0.3)"
            strokeWidth={1}
            zIndex={1}
          />
        ))}

        {/* Danger Zone Highlight - Pulsing red circle */}
        {dangerZoneCenter && isInDangerZone && (
          <>
            <Circle
              center={dangerZoneCenter}
              radius={1000}
              fillColor="rgba(255, 0, 0, 0.15)"
              strokeColor="rgba(255, 0, 0, 0.8)"
              strokeWidth={3}
              zIndex={10}
            />
            <Circle
              center={dangerZoneCenter}
              radius={500}
              fillColor="rgba(255, 0, 0, 0.25)"
              strokeColor="rgba(255, 0, 0, 0.9)"
              strokeWidth={2}
              zIndex={11}
            />
          </>
        )}

        {/* User's current location marker (blue) */}
        <Marker
          coordinate={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          }}
          title="You are here"
          description={`Lat: ${location.coords.latitude.toFixed(6)}, Lng: ${location.coords.longitude.toFixed(6)}`}
          pinColor={isInDangerZone ? 'orange' : 'blue'}
          zIndex={100}
        />

        {/* Incident markers (red) */}
        {incidents.map((incident) => (
          <Marker
            key={incident.id}
            coordinate={{
              latitude: incident.latitude,
              longitude: incident.longitude,
            }}
            pinColor="red"
            title={`🚨 ${incident.type?.toUpperCase() || 'INCIDENT'}`}
            description={`User: ${incident.userId}\nTime: ${incident.timestamp.toDate().toLocaleString()}\nStatus: ${incident.status}`}
            zIndex={50}
          />
        ))}
      </MapView>
      
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          📍 Live Location {isInDangerZone && '⚠️'}
        </Text>
        <Text style={styles.coordsText}>
          {location.coords.latitude.toFixed(6)}, {location.coords.longitude.toFixed(6)}
        </Text>
        <Text style={styles.accuracyText}>
          Accuracy: ±{location.coords.accuracy?.toFixed(0)}m
        </Text>
        <Text style={styles.alertsText}>
          🚨 Total Incidents: {incidents.length}
        </Text>
        <Text style={styles.heatmapText}>
          🔥 Heatmap Zones: {heatmapPoints.length}
        </Text>
        {nearbyDangerCount > 0 && (
          <View style={[styles.dangerBadge, { backgroundColor: dangerInfo.color }]}>
            <Text style={styles.dangerText}>
              ⚠️ {nearbyDangerCount} nearby incident{nearbyDangerCount > 1 ? 's' : ''} (1km)
            </Text>
          </View>
        )}
        {isInDangerZone && (
          <View style={styles.warningBadge}>
            <Text style={styles.warningText}>
              🚨 HIGH RISK AREA
            </Text>
            <Text style={styles.warningSubtext}>
              Stay alert • Consider alternate route
            </Text>
          </View>
        )}
      </View>

      {/* Live Tracking Banner */}
      <View style={styles.trackingBanner}>
        <View style={styles.pulsingDot} />
        <Text style={styles.trackingText}>🔴 LIVE TRACKING ACTIVE</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ff3b30',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  infoBox: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  infoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  coordsText: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  accuracyText: {
    fontSize: 12,
    color: '#666',
  },
  alertsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ff3b30',
    marginTop: 8,
  },
  heatmapText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#FF8C00',
    marginTop: 4,
  },
  dangerBadge: {
    marginTop: 8,
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  dangerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  warningBadge: {
    marginTop: 8,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#FF0000',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#8B0000',
  },
  warningText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
  },
  warningSubtext: {
    fontSize: 11,
    color: '#fff',
    marginTop: 2,
    opacity: 0.9,
  },
  trackingBanner: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 0, 0, 0.95)',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginRight: 8,
  },
  trackingText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
  },
});
