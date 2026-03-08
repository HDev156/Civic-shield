import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  ScrollView,
  Switch,
} from 'react-native';
import {
  getEmergencyContacts,
  saveEmergencyContacts,
  EmergencyContact,
} from '../services/autoSMSService';
import {
  getEnabledFeatures,
  setFeatureEnabled,
  FeatureStatus,
} from '../services/advancedFeaturesManager';

export default function SettingsScreen() {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [features, setFeatures] = useState<FeatureStatus>({
    voiceRecording: false,
    photoCapture: false,
    liveTracking: false,
    policeStationFinder: false,
    silentPanic: false,
  });

  useEffect(() => {
    loadContacts();
    loadFeatures();
  }, []);

  const loadFeatures = async () => {
    const enabled = await getEnabledFeatures();
    setFeatures(enabled);
  };

  const toggleFeature = async (feature: keyof FeatureStatus, value: boolean) => {
    await setFeatureEnabled(feature, value);
    await loadFeatures();
    Alert.alert(
      'Feature Updated',
      `${feature} is now ${value ? 'enabled' : 'disabled'}`
    );
  };

  const loadContacts = async () => {
    const saved = await getEmergencyContacts();
    setContacts(saved);
  };

  const addContact = async () => {
    if (!newName.trim() || !newPhone.trim()) {
      Alert.alert('Error', 'Please enter both name and phone number');
      return;
    }

    const updated = [...contacts, { name: newName.trim(), phone: newPhone.trim() }];
    await saveEmergencyContacts(updated);
    setContacts(updated);
    setNewName('');
    setNewPhone('');
    Alert.alert('Success', 'Emergency contact added');
  };

  const removeContact = async (index: number) => {
    Alert.alert(
      'Remove Contact',
      `Remove ${contacts[index].name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const updated = contacts.filter((_, i) => i !== index);
            await saveEmergencyContacts(updated);
            setContacts(updated);
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>⚙️ Settings</Text>
        <Text style={styles.subtitle}>Emergency Contacts</Text>

        <View style={styles.addSection}>
          <TextInput
            style={styles.input}
            placeholder="Contact Name"
            value={newName}
            onChangeText={setNewName}
          />
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            value={newPhone}
            onChangeText={setNewPhone}
            keyboardType="phone-pad"
          />
          <TouchableOpacity style={styles.addButton} onPress={addContact}>
            <Text style={styles.addButtonText}>➕ Add Contact</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.listSection}>
          <Text style={styles.listTitle}>
            Saved Contacts ({contacts.length})
          </Text>
          {contacts.length === 0 ? (
            <Text style={styles.emptyText}>
              No emergency contacts added yet
            </Text>
          ) : (
            <FlatList
              data={contacts}
              keyExtractor={(_, index) => index.toString()}
              renderItem={({ item, index }) => (
                <View style={styles.contactCard}>
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactName}>{item.name}</Text>
                    <Text style={styles.contactPhone}>{item.phone}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeContact(index)}
                  >
                    <Text style={styles.removeButtonText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          )}
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>ℹ️ How it works</Text>
          <Text style={styles.infoText}>
            • When SOS is triggered with Auto SMS enabled, all contacts will
            receive an emergency message with your live location
          </Text>
          <Text style={styles.infoText}>
            • Make sure to add trusted contacts who can help in emergencies
          </Text>
          <Text style={styles.infoText}>
            • Test the feature to ensure SMS permissions are granted
          </Text>
        </View>

        {/* Advanced Features Section */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>🚀 Advanced Features</Text>
          <Text style={styles.sectionSubtitle}>
            Enable optional features for enhanced safety
          </Text>

          <View style={styles.featureCard}>
            <View style={styles.featureInfo}>
              <Text style={styles.featureName}>🎤 Voice Recording</Text>
              <Text style={styles.featureDesc}>
                Record audio during emergency
              </Text>
            </View>
            <Switch
              value={features.voiceRecording}
              onValueChange={(v) => toggleFeature('voiceRecording', v)}
              trackColor={{ false: '#ccc', true: '#4CAF50' }}
            />
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureInfo}>
              <Text style={styles.featureName}>📍 Live Location Tracking</Text>
              <Text style={styles.featureDesc}>
                Track location every 10 seconds
              </Text>
            </View>
            <Switch
              value={features.liveTracking}
              onValueChange={(v) => toggleFeature('liveTracking', v)}
              trackColor={{ false: '#ccc', true: '#4CAF50' }}
            />
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureInfo}>
              <Text style={styles.featureName}>🚓 Police Station Finder</Text>
              <Text style={styles.featureDesc}>
                Find nearby police stations
              </Text>
            </View>
            <Switch
              value={features.policeStationFinder}
              onValueChange={(v) => toggleFeature('policeStationFinder', v)}
              trackColor={{ false: '#ccc', true: '#4CAF50' }}
            />
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureInfo}>
              <Text style={styles.featureName}>🤫 Silent Panic Mode</Text>
              <Text style={styles.featureDesc}>
                Trigger SOS without UI/sound
              </Text>
            </View>
            <Switch
              value={features.silentPanic}
              onValueChange={(v) => toggleFeature('silentPanic', v)}
              trackColor={{ false: '#ccc', true: '#4CAF50' }}
            />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 24,
  },
  addSection: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  listSection: {
    marginBottom: 24,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    padding: 20,
  },
  contactCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  contactPhone: {
    fontSize: 14,
    color: '#666',
  },
  removeButton: {
    padding: 8,
  },
  removeButtonText: {
    fontSize: 20,
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1976D2',
  },
  infoText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 6,
    lineHeight: 20,
  },
  featuresSection: {
    marginTop: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  featureCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  featureInfo: {
    flex: 1,
    marginRight: 12,
  },
  featureName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 13,
    color: '#666',
  },
});
