/**
 * Clean SOS Screen with Real Location and SMS
 * Keeps shake detection, adds working location/SMS
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Modal, Switch } from 'react-native';
import { triggerRealSOS } from '../services/realSOSService';
import { startShakeDetection, stopShakeDetection, isShakeDetectionAvailable } from '../services/shakeDetectionService';
import { findNearbyPoliceStations, callEmergency } from '../services/policeStationFinderService';
import { startRecording, stopRecording, getRecordingStatus } from '../services/voiceRecordingService';
import { isFeatureEnabled } from '../services/advancedFeaturesManager';
import CountdownModal from '../components/CountdownModal';
import { Linking } from 'react-native';

export default function CleanSOSScreen() {
  const [loading, setLoading] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showCountdownModal, setShowCountdownModal] = useState(false);
  const [selectedType, setSelectedType] = useState<'kidnap' | 'assault' | 'emergency'>('emergency');
  const [shakeDetectionEnabled, setShakeDetectionEnabled] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<string>('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  // Shake detection setup
  useEffect(() => {
    const initShake = async () => {
      const available = await isShakeDetectionAvailable();
      
      if (shakeDetectionEnabled && available) {
        console.log('📳 Enabling shake detection...');
        startShakeDetection(() => {
          console.log('🚨 SHAKE DETECTED!');
          Alert.alert(
            '🚨 Shake Detected',
            'Emergency SOS will be triggered',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Send SOS', 
                style: 'destructive',
                onPress: () => {
                  setSelectedType('emergency');
                  setShowCountdownModal(true);
                }
              }
            ]
          );
        });
      } else {
        stopShakeDetection();
      }
    };

    initShake();

    return () => {
      stopShakeDetection();
    };
  }, [shakeDetectionEnabled]);

  // Recording timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Handle type selection
  const handleTypeSelection = (type: 'kidnap' | 'assault' | 'emergency') => {
    setSelectedType(type);
    setShowTypeModal(false);
    setShowCountdownModal(true);
  };

  // Handle countdown cancel
  const handleCountdownCancel = () => {
    setShowCountdownModal(false);
  };

  // Handle send now
  const handleSendNow = async () => {
    setShowCountdownModal(false);
    await executeSOS();
  };

  // Handle auto send
  const handleAutoSend = async () => {
    setShowCountdownModal(false);
    await executeSOS();
  };

  // Execute SOS with real location and SMS
  const executeSOS = async () => {
    setLoading(true);
    
    try {
      console.log('🚨 Executing real SOS...');
      
      // Trigger real SOS (gets GPS + sends SMS)
      const result = await triggerRealSOS(selectedType);
      
      setLoading(false);

      if (result.success && result.location && result.mapsLink) {
        // Update UI with location
        setCurrentLocation(result.mapsLink);
        
        // Show success message
        Alert.alert(
          '✅ SOS Sent',
          `Location: ${result.location.latitude.toFixed(6)}, ${result.location.longitude.toFixed(6)}\n\n` +
          `SMS: ${result.smsResult}\n\n` +
          `Maps Link: ${result.mapsLink}`,
          [{ text: 'OK' }]
        );
      } else {
        // Show error
        Alert.alert(
          '❌ SOS Failed',
          result.error || 'Unknown error occurred',
          [{ text: 'OK' }]
        );
      }
      
    } catch (error) {
      setLoading(false);
      console.error('SOS error:', error);
      
      Alert.alert(
        '❌ Error',
        error instanceof Error ? error.message : 'Failed to send SOS',
        [{ text: 'OK' }]
      );
    }
  };

  const handleSOS = () => {
    setShowTypeModal(true);
  };

  // Find nearby police stations
  const handleFindPolice = async () => {
    try {
      Alert.alert('🚓 Finding Police Stations', 'Searching nearby...');
      const result = await findNearbyPoliceStations(5);
      
      if (result.success && result.stations && result.stations.length > 0) {
        const station = result.stations[0];
        Alert.alert(
          '🚓 Nearest Police Station',
          `${station.name}\n${station.address}\nDistance: ${station.distance}m`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Get Directions',
              onPress: () => {
                const url = `https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}`;
                Linking.openURL(url);
              }
            },
            {
              text: 'Call 100',
              onPress: () => {
                Linking.openURL('tel:100');
              }
            }
          ]
        );
      } else {
        Alert.alert(
          '🚓 Police Stations',
          'Feature coming soon! For now, call emergency:\n\n100 (India)\n911 (US)\n112 (EU)',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Call 100',
              onPress: () => Linking.openURL('tel:100')
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to find police stations');
    }
  };

  // Toggle voice recording
  const handleToggleRecording = async () => {
    try {
      if (isRecording) {
        const result = await stopRecording();
        setIsRecording(false);
        if (result.success) {
          Alert.alert('✅ Recording Stopped', `Recording saved: ${result.uri}`);
        }
      } else {
        const enabled = await isFeatureEnabled('voiceRecording');
        if (!enabled) {
          Alert.alert('Feature Disabled', 'Enable Voice Recording in Settings first');
          return;
        }
        
        const result = await startRecording();
        if (result.success) {
          setIsRecording(true);
          Alert.alert('🎤 Recording Started', 'Audio is being recorded');
        } else {
          Alert.alert('Error', result.message);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Recording failed');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Civic Shield</Text>
      <Text style={styles.subtitle}>Emergency Response System</Text>
      
      {/* Shake Detection Toggle */}
      <View style={styles.settingsBox}>
        <Text style={styles.settingsTitle}>⚙️ Settings</Text>
        
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>📳 Shake Detection</Text>
          <Switch
            value={shakeDetectionEnabled}
            onValueChange={setShakeDetectionEnabled}
            trackColor={{ false: '#ccc', true: '#4CAF50' }}
          />
        </View>
      </View>

      {/* Current Location Display */}
      {currentLocation && (
        <View style={styles.locationBox}>
          <Text style={styles.locationLabel}>📍 Last Location:</Text>
          <Text style={styles.locationText} numberOfLines={2}>
            {currentLocation}
          </Text>
        </View>
      )}

      {/* Voice Recording Status */}
      {isRecording && (
        <View style={styles.recordingBox}>
          <Text style={styles.recordingLabel}>🎤 Recording: {formatTime(recordingTime)}</Text>
        </View>
      )}

      {/* Quick Action Buttons */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleFindPolice}
        >
          <Text style={styles.actionButtonText}>🚓 Find Police</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, isRecording && styles.actionButtonActive]}
          onPress={handleToggleRecording}
        >
          <Text style={styles.actionButtonText}>
            {isRecording ? '⏹️ Stop Recording' : '🎤 Start Recording'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* SOS Button */}
      <TouchableOpacity
        style={[styles.sosButton, loading && styles.sosButtonDisabled]}
        onPress={handleSOS}
        disabled={loading}
      >
        <Text style={styles.sosText}>
          {loading ? 'SENDING...' : 'SOS'}
        </Text>
      </TouchableOpacity>
      
      <Text style={styles.info}>
        Press the button to send an emergency alert with your real GPS location via SMS
      </Text>

      {/* Type Selection Modal */}
      <Modal
        visible={showTypeModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Emergency Type</Text>
            
            <TouchableOpacity
              style={[styles.typeButton, styles.kidnap]}
              onPress={() => handleTypeSelection('kidnap')}
            >
              <Text style={styles.typeButtonText}>🚨 Kidnap</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeButton, styles.assault]}
              onPress={() => handleTypeSelection('assault')}
            >
              <Text style={styles.typeButtonText}>⚠️ Assault</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeButton, styles.emergency]}
              onPress={() => handleTypeSelection('emergency')}
            >
              <Text style={styles.typeButtonText}>🆘 General Emergency</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowTypeModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Countdown Modal */}
      <CountdownModal
        visible={showCountdownModal}
        onCancel={handleCountdownCancel}
        onSendNow={handleSendNow}
        onAutoSend={handleAutoSend}
        incidentType={selectedType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  settingsBox: {
    width: '100%',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingLabel: {
    fontSize: 14,
    color: '#333',
  },
  locationBox: {
    width: '100%',
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  locationLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1976D2',
  },
  locationText: {
    fontSize: 12,
    color: '#555',
    fontFamily: 'monospace',
  },
  sosButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#ff3b30',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  sosButtonDisabled: {
    backgroundColor: '#ff9999',
  },
  sosText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  info: {
    marginTop: 40,
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  typeButton: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  kidnap: {
    backgroundColor: '#8B0000',
  },
  assault: {
    backgroundColor: '#FF6347',
  },
  emergency: {
    backgroundColor: '#FF8C00',
  },
  typeButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  cancelButton: {
    padding: 14,
    borderRadius: 12,
    marginTop: 8,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  quickActions: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonActive: {
    backgroundColor: '#FF5722',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  recordingBox: {
    width: '100%',
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FF5722',
  },
  recordingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D32F2F',
    textAlign: 'center',
  },
});
