import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import CleanSOSScreen from './src/screens/CleanSOSScreen';
import MapScreen from './src/screens/MapScreen';
import IncidentHistoryScreen from './src/screens/IncidentHistoryScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ErrorBoundary from './src/components/ErrorBoundary';
import { initializeFeatures } from './src/services/featureManager';

const Tab = createBottomTabNavigator();

/**
 * BUILD 15 - REAL LOCATION & SMS
 * Uses expo-location and expo-sms for device-native functionality
 * No cloud APIs - everything runs on device
 */

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [initStatus, setInitStatus] = useState('Starting...');

  useEffect(() => {
    console.log('🚀 BUILD 12 - CIVIC SHIELD CRASH FIX');
    
    async function initApp() {
      try {
        // Step 1: Render UI first
        setInitStatus('Loading UI...');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log('✅ UI ready to render');
        setIsReady(true);
        
        // Step 2: Request ALL permissions on startup
        setInitStatus('Requesting permissions...');
        try {
          await requestAllPermissions();
        } catch (permError) {
          console.error('⚠️ Permission request failed (non-critical):', permError);
        }
        
        // Step 3: Initialize features AFTER permissions (optional, won't crash if fails)
        setInitStatus('Initializing features...');
        try {
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          console.log('🔧 Starting feature initialization...');
          const status = await initializeFeatures();
          
          console.log('✅ All features initialized:', status);
        } catch (featureError) {
          console.error('⚠️ Feature initialization failed (non-critical):', featureError);
        }
        
        setInitStatus('Ready!');
        
      } catch (error) {
        console.error('❌ App initialization error:', error);
        // Still show UI even if everything fails
        setIsReady(true);
        setInitStatus('Ready (some features may be limited)');
      }
    }
    
    initApp();
  }, []);

  /**
   * Request all permissions on app startup
   * This ensures permissions are granted BEFORE emergency
   */
  async function requestAllPermissions() {
    console.log('');
    console.log('🔐 REQUESTING ALL PERMISSIONS ON STARTUP');
    console.log('This ensures app works immediately in emergency');
    console.log('');

    // Location Permission (CRITICAL)
    try {
      const Location = require('expo-location');
      console.log('📍 Requesting location permission...');
      
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus === 'granted') {
        console.log('✅ Foreground location granted');
        
        // Request background location for continuous tracking
        try {
          const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
          if (backgroundStatus === 'granted') {
            console.log('✅ Background location granted');
          } else {
            console.log('⚠️ Background location denied - live tracking may be limited');
          }
        } catch (bgError) {
          console.log('⚠️ Background location request failed:', bgError);
        }
      } else {
        console.log('⚠️ Location permission denied');
      }
    } catch (error) {
      console.log('⚠️ Location module not available:', error);
    }

    // SMS Permission (CRITICAL for auto-alerts)
    try {
      const SMS = require('expo-sms');
      console.log('📱 Checking SMS availability...');
      const isAvailable = await SMS.isAvailableAsync();
      if (isAvailable) {
        console.log('✅ SMS available');
      } else {
        console.log('⚠️ SMS not available on this device');
      }
    } catch (error) {
      console.log('⚠️ SMS module not available:', error);
    }

    // Microphone Permission (for voice recording)
    try {
      const { Audio } = require('expo-av');
      console.log('🎤 Requesting microphone permission...');
      const { status } = await Audio.requestPermissionsAsync();
      if (status === 'granted') {
        console.log('✅ Microphone permission granted');
      } else {
        console.log('⚠️ Microphone permission denied');
      }
    } catch (error) {
      console.log('⚠️ Audio module not available:', error);
    }

    console.log('');
    console.log('✅ PERMISSION REQUEST COMPLETED');
    console.log('App is ready for emergency use');
    console.log('');
  }

  // Show splash screen while initializing
  if (!isReady) {
    return (
      <View style={styles.splashContainer}>
        <Text style={styles.splashTitle}>🛡️</Text>
        <Text style={styles.splashText}>Civic Shield</Text>
        <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
        <Text style={styles.splashSubtext}>{initStatus}</Text>
      </View>
    );
  }
  
  return (
    <ErrorBoundary>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            tabBarActiveTintColor: '#007AFF',
            tabBarInactiveTintColor: '#999',
          }}
        >
          <Tab.Screen 
            name="SOS" 
            component={CleanSOSScreen}
            options={{ 
              title: 'Emergency',
              tabBarIcon: () => <Text style={{ fontSize: 24 }}>🚨</Text>
            }}
          />
          <Tab.Screen 
            name="Map" 
            component={MapScreen}
            options={{ 
              title: 'Incidents',
              tabBarIcon: () => <Text style={{ fontSize: 24 }}>🗺️</Text>
            }}
          />
          <Tab.Screen 
            name="History" 
            component={IncidentHistoryScreen}
            options={{ 
              title: 'History',
              tabBarIcon: () => <Text style={{ fontSize: 24 }}>📜</Text>
            }}
          />
          <Tab.Screen 
            name="Settings" 
            component={SettingsScreen}
            options={{ 
              title: 'Settings',
              tabBarIcon: () => <Text style={{ fontSize: 24 }}>⚙️</Text>
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  splashTitle: {
    fontSize: 80,
    marginBottom: 20,
  },
  splashText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 40,
  },
  loader: {
    marginBottom: 20,
  },
  splashSubtext: {
    fontSize: 14,
    color: '#999',
  },
});
