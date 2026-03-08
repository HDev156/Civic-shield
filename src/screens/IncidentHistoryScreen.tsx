import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  Linking,
  Alert 
} from 'react-native';
import { getSOSHistory } from '../services/realSOSService';

interface Incident {
  type: 'kidnap' | 'assault' | 'emergency';
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: number;
  };
  mapsLink: string;
  timestamp: number;
  smsSuccess: boolean;
}

export default function IncidentHistoryScreen() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('📜 IncidentHistoryScreen: Loading incident history...');
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const history = await getSOSHistory();
      console.log(`✅ Loaded ${history.length} incidents from local storage`);
      setIncidents(history);
      setLoading(false);
    } catch (error) {
      console.error('❌ Error loading incident history:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to load incident history');
    }
  };

  const getIncidentIcon = (type?: string): string => {
    if (!type) return '📍';
    switch (type) {
      case 'kidnap': return '🚨';
      case 'assault': return '⚠️';
      case 'emergency': return '🆘';
      default: return '📍';
    }
  };

  const getIncidentColor = (type?: string): string => {
    if (!type) return '#999';
    switch (type) {
      case 'kidnap': return '#8B0000';
      case 'assault': return '#FF6347';
      case 'emergency': return '#FF8C00';
      default: return '#999';
    }
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const formatLocation = (latitude: number, longitude: number): string => {
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  };

  const openOnMap = (incident: Incident) => {
    console.log('🗺️ Opening incident on map:', {
      type: incident.type,
      location: `${incident.location.latitude}, ${incident.location.longitude}`
    });

    Linking.openURL(incident.mapsLink).catch(err => {
      console.error('Failed to open maps:', err);
      Alert.alert('Error', 'Failed to open maps');
    });
  };

  const renderIncident = ({ item }: { item: Incident }) => (
    <TouchableOpacity 
      style={styles.incidentCard}
      onPress={() => openOnMap(item)}
      activeOpacity={0.7}
    >
      <View style={styles.incidentHeader}>
        <View style={styles.typeContainer}>
          <Text style={styles.icon}>{getIncidentIcon(item.type)}</Text>
          <View>
            <Text style={[styles.type, { color: getIncidentColor(item.type) }]}>
              {item.type.toUpperCase()}
            </Text>
            <Text style={styles.status}>
              {item.smsSuccess ? '✅ SMS Sent' : '⚠️ SMS Failed'}
            </Text>
          </View>
        </View>
        <Text style={styles.time}>{formatTimestamp(item.timestamp)}</Text>
      </View>

      <View style={styles.incidentBody}>
        <View style={styles.infoRow}>
          <Text style={styles.label}>📍 Location:</Text>
          <Text style={styles.value}>
            {formatLocation(item.location.latitude, item.location.longitude)}
          </Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>🎯 Accuracy:</Text>
          <Text style={styles.value}>{item.location.accuracy.toFixed(0)}m</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>🔗 Link:</Text>
          <Text style={styles.value} numberOfLines={1}>{item.mapsLink}</Text>
        </View>
      </View>

      <View style={styles.mapButton}>
        <Text style={styles.mapButtonText}>🗺️ View on Map</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading incident history...</Text>
      </View>
    );
  }

  if (incidents.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📋</Text>
        <Text style={styles.emptyText}>No incidents recorded yet</Text>
        <Text style={styles.emptySubtext}>
          Incidents will appear here when SOS alerts are triggered
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Incident History</Text>
        <Text style={styles.headerSubtitle}>{incidents.length} total incidents</Text>
      </View>

      <FlatList
        data={incidents}
        renderItem={renderIncident}
        keyExtractor={(item, index) => `${item.timestamp}-${index}`}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  listContent: {
    padding: 16,
  },
  incidentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  incidentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 32,
    marginRight: 12,
  },
  type: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  status: {
    fontSize: 12,
    color: '#999',
  },
  time: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  incidentBody: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#666',
    width: 100,
  },
  value: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    fontFamily: 'monospace',
  },
  mapButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  mapButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
