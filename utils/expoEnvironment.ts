/**
 * Expo Go Environment Detection and Native Module Availability
 * 
 * This module provides utilities for detecting whether the app is running
 * in Expo Go vs a custom development build, and checking native module availability.
 */

import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Detects if the app is running in Expo Go
 * Returns true if running in Expo Go, false for custom development builds
 */
export const IS_EXPO_GO = Constants.appOwnership === 'expo';

/**
 * Returns a human-readable environment name
 */
export const getEnvironmentName = (): string => {
  return IS_EXPO_GO ? 'Expo Go' : 'Custom Build';
};

/**
 * Checks if a native module is available
 * Useful for lazy loading native dependencies
 */
export const isNativeModuleAvailable = (moduleName: string): boolean => {
  if (IS_EXPO_GO) {
    // Native modules are not available in Expo Go
    return false;
  }
  
  try {
    // Try to require the module
    require(moduleName);
    return true;
  } catch {
    return false;
  }
};

/**
 * Safe lazy import of native modules
 * Returns the module if available, null otherwise
 * 
 * WARNING: This function uses dynamic require() which should only be called
 * with trusted, validated module names. Do not pass user-provided input.
 */
export const lazyLoadNativeModule = <T = any>(moduleName: string): T | null => {
  if (IS_EXPO_GO) {
    console.log(`[ExpoEnvironment] Skipping native module '${moduleName}' in Expo Go`);
    return null;
  }
  
  try {
    const module = require(moduleName);
    console.log(`[ExpoEnvironment] Successfully loaded native module '${moduleName}'`);
    return module as T;
  } catch (error) {
    console.warn(`[ExpoEnvironment] Failed to load native module '${moduleName}':`, error);
    return null;
  }
};

/**
 * Check if WebRTC is available (react-native-webrtc)
 */
export const isWebRTCAvailable = (): boolean => {
  return !IS_EXPO_GO && isNativeModuleAvailable('react-native-webrtc');
};

/**
 * Check if custom native media bridge is available
 */
export const isNativeMediaBridgeAvailable = (): boolean => {
  if (IS_EXPO_GO) return false;
  if (Platform.OS !== 'ios') return false;
  
  try {
    const { NativeModules } = require('react-native');
    const NativeMediaBridge = NativeModules.NativeMediaBridge;
    return Boolean(NativeMediaBridge);
  } catch {
    return false;
  }
};

/**
 * Check if WebRTC Loopback is available
 */
export const isWebRTCLoopbackAvailable = (): boolean => {
  if (IS_EXPO_GO) return false;
  if (Platform.OS !== 'ios') return false;
  
  try {
    const { NativeModules } = require('react-native');
    const WebRtcLoopback = NativeModules.WebRtcLoopback;
    return Boolean(WebRtcLoopback);
  } catch {
    return false;
  }
};

/**
 * Get a list of available native features
 */
export const getAvailableNativeFeatures = (): {
  webrtc: boolean;
  nativeMediaBridge: boolean;
  webrtcLoopback: boolean;
} => {
  return {
    webrtc: isWebRTCAvailable(),
    nativeMediaBridge: isNativeMediaBridgeAvailable(),
    webrtcLoopback: isWebRTCLoopbackAvailable(),
  };
};

/**
 * Get comprehensive environment info
 */
export const getEnvironmentInfo = () => {
  const features = getAvailableNativeFeatures();
  
  return {
    isExpoGo: IS_EXPO_GO,
    environmentName: getEnvironmentName(),
    platform: Platform.OS,
    platformVersion: Platform.Version,
    expoVersion: Constants.expoVersion,
    appOwnership: Constants.appOwnership,
    nativeFeatures: features,
    compatibilityMode: IS_EXPO_GO ? 'webview-only' : 'full-native',
  };
};

/**
 * Log environment information for debugging
 */
export const logEnvironmentInfo = (): void => {
  const info = getEnvironmentInfo();
  console.log('[ExpoEnvironment] ========== ENVIRONMENT INFO ==========');
  console.log('[ExpoEnvironment] Running in:', info.environmentName);
  console.log('[ExpoEnvironment] Platform:', info.platform, info.platformVersion);
  console.log('[ExpoEnvironment] Expo Version:', info.expoVersion);
  console.log('[ExpoEnvironment] Compatibility Mode:', info.compatibilityMode);
  console.log('[ExpoEnvironment] Native Features:', JSON.stringify(info.nativeFeatures, null, 2));
  console.log('[ExpoEnvironment] =============================================');
};
