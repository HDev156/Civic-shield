/**
 * Voice Recording Service with Safe Initialization
 * Prevents crashes if expo-av is unavailable
 */

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

let Audio: any = null;
let isAvailable = false;

// Safe module loading with try-catch
try {
  console.log('🎤 Loading expo-av...');
  const av = require('expo-av');
  Audio = av.Audio;
  isAvailable = true;
  console.log('✅ expo-av loaded successfully');
} catch (error) {
  console.warn('⚠️ expo-av not available:', error);
  console.log('ℹ️ Voice recording will be disabled');
}

let recording: any = null;
let recordingUri: string | null = null;

export function isVoiceRecordingAvailable(): boolean {
  return isAvailable;
}

export async function startVoiceRecording(duration: number = 60000): Promise<void> {
  if (!isAvailable || !Audio) {
    console.log('⚠️ Voice recording not available - module not loaded');
    return;
  }

  try {
    console.log('🎤 Starting voice recording...');

    // Request permission first
    const permission = await Audio.requestPermissionsAsync();
    if (permission.status !== 'granted') {
      console.error('❌ Audio permission denied');
      console.log('ℹ️ Voice recording disabled - permission required');
      return;
    }

    console.log('✅ Audio permission granted');

    // Configure audio mode
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    // Start recording
    recording = new Audio.Recording();
    await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    await recording.startAsync();

    console.log('✅ Recording started');

    // Auto-stop after duration
    setTimeout(async () => {
      await stopVoiceRecording();
    }, duration);

  } catch (error) {
    console.error('❌ Failed to start recording:', error);
    recording = null;
    // Don't throw - app should continue working
  }
}

export async function stopVoiceRecording(): Promise<string | null> {
  if (!recording) {
    return null;
  }

  try {
    console.log('🛑 Stopping recording...');
    await recording.stopAndUnloadAsync();
    
    const uri = recording.getURI();
    recordingUri = uri;
    recording = null;

    console.log('✅ Recording stopped');
    console.log('📁 File URI:', uri);

    return uri;
  } catch (error) {
    console.error('❌ Failed to stop recording:', error);
    recording = null;
    return null;
  }
}

export async function uploadRecordingToFirebase(
  uri: string,
  incidentId: string
): Promise<string> {
  try {
    console.log('☁️ Uploading recording to Firebase...');

    const response = await fetch(uri);
    const blob = await response.blob();

    const storageRef = ref(storage, `recordings/${incidentId}.m4a`);

    await uploadBytes(storageRef, blob);
    console.log('✅ Upload complete');

    const downloadURL = await getDownloadURL(storageRef);
    console.log('🔗 Download URL:', downloadURL);

    return downloadURL;
  } catch (error) {
    console.error('❌ Failed to upload recording:', error);
    throw error;
  }
}

export function getRecordingUri(): string | null {
  return recordingUri;
}
