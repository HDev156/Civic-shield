import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Modal, Share, Switch } from 'react-native';
import { sendSOSAlert } from '../services/locationService';
import { sendEnhancedSOSAlert } from '../services/sosService';
import { testFirebaseConnection } from '../firebase';
import CountdownModal from '../components/CountdownModal';
import { startShakeDetection, stopShakeDetection, isShakeDetectionAvailable } from '../services/shakeDetectionService';
import { isSMSFeatureAvailable } from '../services/autoSMSService';
import { isVoiceRecordingAvailable } from '../services/voiceRecordingService';
import { getFeatureStatus, onFeaturesReady } from '../services/featureManager';

export default function SOSScreen() {
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showCountdownModal, setShowCountdownModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedType, setSelectedType] = useState<'kidnap' | 'assault' | 'emergency'>('emergency');
  const [locationLink, setLocationLink] = useState<string>('');
  const [incidentDetails, setIncidentDetails] = useState<{
    type: string;
    docId: string;
    latitude: number;
    longitude: number;
  } | null>(null);

  // Advanced features toggles
  const [shakeDetectionEnabled, setShakeDetectionEnabled] = useState(false);
  const [autoSMSEnabled, setAutoSMSEnabled] = useState(true);
  const [autoRecordEnabled, setAutoRecordEnabled] = useState(true);
  const [stealthModeEnabled, setStealthModeEnabled] = useState(false);

  // Feature availability from feature manager
  const [featuresReady, setFeaturesReady] = useState(false);
  const [shakeAvailable, setShakeAvailable] = useState(false);
  const [smsAvailable, setSmsAvailable] = useState(false);
  const [recordingAvailable, setRecordingAvailable] = useState(false);

  // Wait for features to initialize
  useEffect(() => {
    console.log('📱 SOSScreen mounted, waiting for features...');
    
    onFeaturesReady((status) => {
      console.log('✅ Features ready in SOSScreen:', status);
      setFeaturesReady(true);
      setShakeAvailable(status.sensors);
      setSmsAvailable(status.sms);
      setRecordingAvailable(status.audio);
    });
  }, []);

  // Shake detection - only start AFTER features are ready
  useEffect(() => {
    if (!featuresReady) {
      console.log('⏳ Waiting for features before enabling shake detection...');
      return;
    }

    // Additional delay after features are ready
    const initTimer = setTimeout(() => {
      if (shakeDetectionEnabled && shakeAvailable) {
        console.log('📳 Enabling shake detection...');
        try {
          startShakeDetection(() => {
            console.log('🚨 SHAKE SOS TRIGGERED!');
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
        } catch (error) {
          console.error('❌ Failed to start shake detection:', error);
        }
      } else {
        stopShakeDetection();
      }
    }, 3000); // 3 second delay AFTER features are ready

    return () => {
      clearTimeout(initTimer);
      stopShakeDetection();
    };
  }, [shakeDetectionEnabled, shakeAvailable, featuresReady]);

  const handleTypeSelection = (type: 'kidnap' | 'assault' | 'emergency') => {
    console.log('');
    console.log('🔴 USER SELECTED SOS TYPE:', type.toUpperCase());
    setSelectedType(type);
    setShowTypeModal(false);
    setShowCountdownModal(true);
  };

  const handleCountdownCancel = () => {
    console.log('❌ SOS CANCELLED BY USER');
    setShowCountdownModal(false);
  };

  const handleSendNow = async () => {
    console.log('⚡ SEND NOW PRESSED - IMMEDIATE SOS');
    setShowCountdownModal(false);
    await executeSOS();
  };

  const handleAutoSend = async () => {
    console.log('⏰ COUNTDOWN COMPLETED - AUTO-SENDING SOS');
    setShowCountdownModal(false);
    await executeSOS();
  };

  const executeSOS = async () => {
    setLoading(true);
    
    console.log('');
    console.log('═══════════════════════════════════════');
    console.log('🚨 EXECUTING SOS ALERT');
    console.log(`Type: ${selectedType.toUpperCase()}`);
    console.log('═══════════════════════════════════════');
    console.log('');
    
    try {
      // Use enhanced SOS with available features
      const result = await sendEnhancedSOSAlert(selectedType, {
        autoSMS: autoSMSEnabled && smsAvailable,
        autoRecord: autoRecordEnabled && recordingAvailable,
        stealthMode: stealthModeEnabled,
      });
      
      setLoading(false);

      // Store incident details for sharing
      setIncidentDetails({
        type: selectedType,
        docId: result.docId,
        latitude: result.latitude,
        longitude: result.longitude
      });

      // Generate Google Maps link
      const mapsLink = `https://maps.google.com/?q=${result.latitude},${result.longitude}`;
      setLocationLink(mapsLink);

      console.log('📍 Google Maps Link:', mapsLink);

      // Show share modal (unless stealth mode)
      if (!stealthModeEnabled) {
        setShowShareModal(true);
      } else {
        console.log('🤫 Stealth mode: No share modal shown');
        Alert.alert(
          '✅ SOS Sent Silently',
          'Emergency alert sent in stealth mode',
          [{ text: 'OK', style: 'default' }]
        );
      }
      
    } catch (error: any) {
      setLoading(false);
      
      console.error('');
      console.error('🔴 SOS EXECUTION ERROR');
      console.error('Error:', error);
      console.error('');
      
      let errorMessage = 'Failed to send SOS alert. ';
      
      if (error.message.includes('Location permission')) {
        errorMessage += 'Location permission denied. Please enable location access.';
      } else if (error.message.includes('network')) {
        errorMessage += 'Network error. Please check your internet connection.';
      } else if (error.code === 'permission-denied') {
        errorMessage += 'Firebase permission denied. Please check Firestore rules.';
      } else {
        errorMessage += error.message || 'Unknown error occurred.';
      }
      
      Alert.alert(
        '❌ Error', 
        errorMessage,
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  const handleShareLocation = async () => {
    if (!incidentDetails) return;

    const message = `🚨 EMERGENCY

I need help. My location:
${locationLink}

Incident Type: ${incidentDetails.type.toUpperCase()}
Time: ${new Date().toLocaleString()}

Sent from Civic Shield`;

    try {
      console.log('📤 Opening share dialog...');
      console.log('Message:', message);

      const result = await Share.share({
        message: message,
        title: '🚨 Emergency SOS Alert'
      });

      if (result.action === Share.sharedAction) {
        console.log('✅ Location shared successfully');
        if (result.activityType) {
          console.log(`Shared via: ${result.activityType}`);
        }
        
        Alert.alert(
          '✅ Shared',
          'Your emergency location has been shared successfully.',
          [{ text: 'OK', onPress: () => setShowShareModal(false) }]
        );
      } else if (result.action === Share.dismissedAction) {
        console.log('ℹ️ Share dismissed by user');
      }
    } catch (error) {
      console.error('❌ Share failed:', error);
      Alert.alert('Error', 'Failed to share location. Please try again.');
    }
  };

  const handleCopyLink = () => {
    Alert.alert(
      'Link Ready',
      `Copy this link:\n\n${locationLink}`,
      [{ text: 'OK', style: 'default' }]
    );
  };

  const handleSOS = () => {
    setShowTypeModal(true);
  };

  const handleTestFirebase = async () => {
    setTesting(true);
    console.log('=== Firebase Connection Test Started ===');
    try {
      const success = await testFirebaseConnection();
      if (success) {
        Alert.alert(
          '✅ Success',
          'Firebase connection successful! Check console for details.'
        );
      } else {
        Alert.alert(
          '❌ Failed',
          'Firebase connection failed. Check console for error details.'
        );
      }
    } catch (error) {
      console.error('Test error:', error);
      Alert.alert('Error', 'Test failed: ' + (error as Error).message);
    } finally {
      setTesting(false);
      console.log('=== Firebase Connection Test Ended ===');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Civic Shield</Text>
      <Text style={styles.subtitle}>Emergency Response System</Text>
      
      {/* Advanced Features Settings */}
      <View style={styles.settingsBox}>
        <Text style={styles.settingsTitle}>⚙️ Advanced Features</Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingLabelContainer}>
            <Text style={styles.settingLabel}>📳 Shake Detection</Text>
            {!shakeAvailable && (
              <Text style={styles.unavailableText}>(Dev build only)</Text>
            )}
          </View>
          <Switch
            value={shakeDetectionEnabled && shakeAvailable}
            onValueChange={setShakeDetectionEnabled}
            disabled={!shakeAvailable}
            trackColor={{ false: '#ccc', true: '#4CAF50' }}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingLabelContainer}>
            <Text style={styles.settingLabel}>📱 Auto SMS</Text>
            {!smsAvailable && (
              <Text style={styles.unavailableText}>(Dev build only)</Text>
            )}
          </View>
          <Switch
            value={autoSMSEnabled && smsAvailable}
            onValueChange={setAutoSMSEnabled}
            disabled={!smsAvailable}
            trackColor={{ false: '#ccc', true: '#4CAF50' }}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingLabelContainer}>
            <Text style={styles.settingLabel}>🎤 Auto Record</Text>
            {!recordingAvailable && (
              <Text style={styles.unavailableText}>(Dev build only)</Text>
            )}
          </View>
          <Switch
            value={autoRecordEnabled && recordingAvailable}
            onValueChange={setAutoRecordEnabled}
            disabled={!recordingAvailable}
            trackColor={{ false: '#ccc', true: '#4CAF50' }}
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>🤫 Stealth Mode</Text>
          <Switch
            value={stealthModeEnabled}
            onValueChange={setStealthModeEnabled}
            trackColor={{ false: '#ccc', true: '#FF9800' }}
          />
        </View>

        {(!shakeAvailable || !smsAvailable || !recordingAvailable) && (
          <Text style={styles.devBuildNote}>
            ℹ️ Some features need native modules (expo-sensors, expo-sms, expo-av).
            {'\n\n'}
            ✅ Working now: SOS, Location, Firebase, Map, Sharing, Stealth
            {'\n\n'}
            To enable all: See ENABLE_ALL_FEATURES.md
          </Text>
        )}
      </View>
      
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
        Press the button to send an emergency alert with your location
      </Text>

      <TouchableOpacity
        style={[styles.testButton, testing && styles.testButtonDisabled]}
        onPress={handleTestFirebase}
        disabled={testing}
      >
        <Text style={styles.testButtonText}>
          {testing ? '🔄 Testing...' : '🔧 Test Firebase Connection'}
        </Text>
      </TouchableOpacity>

      {/* Incident Type Selection Modal */}
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

      {/* 10-Second Countdown Modal */}
      <CountdownModal
        visible={showCountdownModal}
        onCancel={handleCountdownCancel}
        onSendNow={handleSendNow}
        onAutoSend={handleAutoSend}
        incidentType={selectedType}
      />

      {/* Share Location Modal */}
      <Modal
        visible={showShareModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowShareModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.shareModalContent}>
            <Text style={styles.shareTitle}>✅ SOS Alert Sent!</Text>
            
            <View style={styles.detailsBox}>
              <Text style={styles.detailsText}>
                Type: {incidentDetails?.type.toUpperCase()}
              </Text>
              <Text style={styles.detailsText}>
                Document ID: {incidentDetails?.docId.substring(0, 8)}...
              </Text>
              <Text style={styles.detailsText}>
                Time: {new Date().toLocaleTimeString()}
              </Text>
            </View>

            <Text style={styles.shareSubtitle}>
              Share your location with emergency contacts
            </Text>

            <TouchableOpacity
              style={styles.shareButton}
              onPress={handleShareLocation}
            >
              <Text style={styles.shareButtonText}>
                📤 Share via WhatsApp/SMS
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.copyButton}
              onPress={handleCopyLink}
            >
              <Text style={styles.copyButtonText}>
                📋 Copy Location Link
              </Text>
            </TouchableOpacity>

            <View style={styles.linkBox}>
              <Text style={styles.linkLabel}>Google Maps Link:</Text>
              <Text style={styles.linkText} numberOfLines={2}>
                {locationLink}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => setShowShareModal(false)}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    marginBottom: 30,
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
  settingLabelContainer: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 14,
    color: '#333',
  },
  unavailableText: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
  },
  devBuildNote: {
    fontSize: 11,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
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
  testButton: {
    marginTop: 30,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  testButtonDisabled: {
    backgroundColor: '#99c7ff',
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
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
  shareModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    width: '100%',
    maxHeight: '80%',
  },
  shareTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#4CAF50',
  },
  shareSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  detailsBox: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  detailsText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 6,
  },
  shareButton: {
    backgroundColor: '#25D366',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  shareButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  copyButton: {
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  copyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  linkBox: {
    backgroundColor: '#F0F0F0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  linkLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  linkText: {
    fontSize: 12,
    color: '#007AFF',
    fontFamily: 'monospace',
  },
  doneButton: {
    backgroundColor: '#E0E0E0',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
});
