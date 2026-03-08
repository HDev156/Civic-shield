/**
 * Voice Recording Service
 * Records audio during emergency with safe error handling
 */

import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

let recording: Audio.Recording | null = null;
let isRecording = false;

/**
 * Check if voice recording is available
 */
export async function isVoiceRecordingAvailable(): Promise<boolean> {
  try {
    const { status } = await Audio.getPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.warn('Voice recording not available:', error);
    return false;
  }
}

/**
 * Request microphone permission
 */
export async function requestMicrophonePermission(): Promise<boolean> {
  try {
    const { status } = await Audio.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting microphone permission:', error);
    return false;
  }
}

/**
 * Start recording audio
 */
export async function startRecording(): Promise<{ success: boolean; message: string }> {
  try {
    console.log('🎤 Starting voice recording...');

    // Check permission
    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) {
      return {
        success: false,
        message: 'Microphone permission denied',
      };
    }

    // Stop any existing recording
    if (recording) {
      await stopRecording();
    }

    // Configure audio mode
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    // Start recording
    const { recording: newRecording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );

    recording = newRecording;
    isRecording = true;

    console.log('✅ Recording started');
    return {
      success: true,
      message: 'Recording started',
    };
  } catch (error) {
    console.error('❌ Failed to start recording:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Recording failed',
    };
  }
}

/**
 * Stop recording and get file URI
 */
export async function stopRecording(): Promise<{ success: boolean; uri?: string; message: string }> {
  try {
    if (!recording) {
      return {
        success: false,
        message: 'No recording in progress',
      };
    }

    console.log('🛑 Stopping recording...');

    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    
    recording = null;
    isRecording = false;

    console.log('✅ Recording stopped:', uri);

    return {
      success: true,
      uri: uri || undefined,
      message: 'Recording saved',
    };
  } catch (error) {
    console.error('❌ Failed to stop recording:', error);
    recording = null;
    isRecording = false;
    
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to stop recording',
    };
  }
}

/**
 * Get recording status
 */
export function getRecordingStatus(): boolean {
  return isRecording;
}

/**
 * Cancel recording without saving
 */
export async function cancelRecording(): Promise<void> {
  try {
    if (recording) {
      await recording.stopAndUnloadAsync();
      recording = null;
      isRecording = false;
      console.log('🗑️ Recording cancelled');
    }
  } catch (error) {
    console.error('Error cancelling recording:', error);
    recording = null;
    isRecording = false;
  }
}
