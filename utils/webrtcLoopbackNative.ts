import { NativeModules, Platform } from 'react-native';
import { isExpoGo, safeRequireNativeModule, getFeatureFlags } from './expoGoCompatibility';

const LoopbackModule = isExpoGo ? null : safeRequireNativeModule('WebRtcLoopback');

/**
 * Check if ring buffer features are available
 * These require native modules (not available in Expo Go)
 */
export const isRingBufferAvailable = (): boolean => {
  const flags = getFeatureFlags();
  return flags.ringBufferRecording;
};

/**
 * Export ring buffer to photos - iOS only, requires native module
 * 
 * EXPO GO: This function will throw an error in Expo Go because
 * it requires the native WebRtcLoopback module which is not available
 * in Expo Go. Build with: expo prebuild && expo run:ios
 */
export const exportRingBufferToPhotos = async (): Promise<void> => {
  if (Platform.OS !== 'ios') {
    throw new Error('Ring buffer export is only supported on iOS.');
  }
  
  if (isExpoGo) {
    throw new Error(
      'Ring buffer export requires a custom development build. ' +
      'Run: expo prebuild && expo run:ios'
    );
  }
  
  if (!LoopbackModule?.exportRingBufferToPhotos) {
    throw new Error(
      'Native WebRtcLoopback module not available. ' +
      'Ensure you are running a custom development build.'
    );
  }
  
  await LoopbackModule.exportRingBufferToPhotos();
};

/**
 * Get ring buffer segments - iOS only, requires native module
 */
export const getRingBufferSegments = async (): Promise<string[]> => {
  if (Platform.OS !== 'ios' || isExpoGo || !LoopbackModule?.getRingBufferSegments) {
    return [];
  }
  
  try {
    return await LoopbackModule.getRingBufferSegments();
  } catch {
    return [];
  }
};

/**
 * Clear ring buffer - iOS only, requires native module
 */
export const clearRingBuffer = async (): Promise<void> => {
  if (Platform.OS !== 'ios' || isExpoGo || !LoopbackModule?.clearRingBuffer) {
    return;
  }
  
  await LoopbackModule.clearRingBuffer();
};
