/**
 * Feature Manager - Safe Sequential Loading System
 * NO IMPORTS of native modules - everything loaded dynamically
 */

interface FeatureStatus {
  location: boolean;
  sensors: boolean;
  sms: boolean;
  audio: boolean;
  firebase: boolean;
}

let featureStatus: FeatureStatus = {
  location: false,
  sensors: false,
  sms: false,
  audio: false,
  firebase: false,
};

let isInitialized = false;
let initializationCallbacks: Array<(status: FeatureStatus) => void> = [];

// Store loaded modules
let loadedModules: any = {
  Location: null,
  Accelerometer: null,
  SMS: null,
  Audio: null,
};

/**
 * Initialize all features in safe sequential order
 * Called AFTER UI renders
 */
export async function initializeFeatures(): Promise<FeatureStatus> {
  if (isInitialized) {
    console.log('ℹ️ Features already initialized');
    return featureStatus;
  }

  console.log('');
  console.log('═══════════════════════════════════════');
  console.log('🚀 FEATURE INITIALIZATION STARTED');
  console.log('═══════════════════════════════════════');
  console.log('');

  // STEP 1: Wait for Firebase auth
  await initializeFirebase();

  // STEP 2: Initialize location services
  await initializeLocation();

  // STEP 3: Initialize sensors (shake detection)
  await initializeSensors();

  // STEP 4: Initialize SMS
  await initializeSMS();

  // STEP 5: Initialize audio recording
  await initializeAudio();

  isInitialized = true;

  console.log('');
  console.log('═══════════════════════════════════════');
  console.log('✅ FEATURE INITIALIZATION COMPLETE');
  console.log('═══════════════════════════════════════');
  console.log('Feature Status:', featureStatus);
  console.log('');

  // Notify all callbacks
  initializationCallbacks.forEach(callback => callback(featureStatus));

  return featureStatus;
}

/**
 * Step 1: Firebase initialization check
 */
async function initializeFirebase(): Promise<void> {
  try {
    console.log('🔥 STEP 1: Checking Firebase...');
    
    // Try to import firebase, but don't crash if it fails
    try {
      const { auth } = require('../firebase');
      
      // Just check if auth exists, don't wait for currentUser
      if (auth) {
        console.log('✅ Firebase module loaded');
        featureStatus.firebase = true;
      } else {
        console.log('⚠️ Firebase auth not available');
        featureStatus.firebase = false;
      }
    } catch (importError) {
      console.error('❌ Firebase import failed:', importError);
      featureStatus.firebase = false;
    }
  } catch (error) {
    console.error('❌ Firebase check failed:', error);
    featureStatus.firebase = false;
  }
}

/**
 * Step 2: Location services initialization
 */
async function initializeLocation(): Promise<void> {
  try {
    console.log('');
    console.log('📍 STEP 2: Initializing Location Services...');
    
    // Dynamically load expo-location
    const Location = require('expo-location');
    loadedModules.Location = Location;
    
    // Request permission
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status === 'granted') {
      console.log('✅ Location permission granted');
      featureStatus.location = true;
    } else {
      console.log('⚠️ Location permission denied');
      featureStatus.location = false;
    }
  } catch (error) {
    console.error('❌ Location initialization failed:', error);
    featureStatus.location = false;
  }
}

/**
 * Step 3: Sensors initialization (shake detection)
 */
async function initializeSensors(): Promise<void> {
  try {
    console.log('');
    console.log('📳 STEP 3: Initializing Sensors...');
    
    // Dynamically load expo-sensors
    const sensors = require('expo-sensors');
    loadedModules.Accelerometer = sensors.Accelerometer;
    
    // Check if available
    const isAvailable = await sensors.Accelerometer.isAvailableAsync();
    
    if (isAvailable) {
      console.log('✅ Sensors available');
      featureStatus.sensors = true;
    } else {
      console.log('⚠️ Sensors not available on this device');
      featureStatus.sensors = false;
    }
  } catch (error) {
    console.error('❌ Sensors initialization failed:', error);
    featureStatus.sensors = false;
  }
}

/**
 * Step 4: SMS initialization
 */
async function initializeSMS(): Promise<void> {
  try {
    console.log('');
    console.log('📱 STEP 4: Initializing SMS...');
    
    // Dynamically load expo-sms
    const SMS = require('expo-sms');
    loadedModules.SMS = SMS;
    
    // Check if available
    const isAvailable = await SMS.isAvailableAsync();
    
    if (isAvailable) {
      console.log('✅ SMS available');
      featureStatus.sms = true;
    } else {
      console.log('⚠️ SMS not available on this device');
      featureStatus.sms = false;
    }
  } catch (error) {
    console.error('❌ SMS initialization failed:', error);
    featureStatus.sms = false;
  }
}

/**
 * Step 5: Audio recording initialization
 */
async function initializeAudio(): Promise<void> {
  try {
    console.log('');
    console.log('🎤 STEP 5: Initializing Audio Recording...');
    
    // Dynamically load expo-av
    const av = require('expo-av');
    loadedModules.Audio = av.Audio;
    
    // Request permission
    const { status } = await av.Audio.requestPermissionsAsync();
    
    if (status === 'granted') {
      console.log('✅ Audio permission granted');
      featureStatus.audio = true;
    } else {
      console.log('⚠️ Audio permission denied');
      featureStatus.audio = false;
    }
  } catch (error) {
    console.error('❌ Audio initialization failed:', error);
    featureStatus.audio = false;
  }
}

/**
 * Get current feature status
 */
export function getFeatureStatus(): FeatureStatus {
  return { ...featureStatus };
}

/**
 * Check if a specific feature is available
 */
export function isFeatureAvailable(feature: keyof FeatureStatus): boolean {
  return featureStatus[feature];
}

/**
 * Subscribe to feature initialization completion
 */
export function onFeaturesReady(callback: (status: FeatureStatus) => void): void {
  if (isInitialized) {
    callback(featureStatus);
  } else {
    initializationCallbacks.push(callback);
  }
}

/**
 * Get loaded module (for services to use)
 */
export function getLoadedModule(moduleName: 'Location' | 'Accelerometer' | 'SMS' | 'Audio'): any {
  return loadedModules[moduleName];
}

/**
 * Reset initialization state (for testing)
 */
export function resetFeatureManager(): void {
  isInitialized = false;
  featureStatus = {
    location: false,
    sensors: false,
    sms: false,
    audio: false,
    firebase: false,
  };
  initializationCallbacks = [];
  loadedModules = {
    Location: null,
    Accelerometer: null,
    SMS: null,
    Audio: null,
  };
}
