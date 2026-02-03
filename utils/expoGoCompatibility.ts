/**
 * Expo Go Compatibility Utility
 * 
 * This module provides utilities for detecting and handling Expo Go environment.
 * Since Expo Go doesn't support custom native modules, this utility helps
 * ensure the app works correctly in both Expo Go and production builds.
 * 
 * Key differences in Expo Go:
 * - No react-native-webrtc support
 * - No custom native modules (NativeMediaBridge, VirtualCamera, etc.)
 * - Limited WebRTC capabilities
 * - Must use WebView-based injection methods only
 */

import Constants from 'expo-constants';
import { Platform } from 'react-native';

// ============================================================================
// EXPO GO DETECTION
// ============================================================================

/**
 * Check if the app is running in Expo Go
 */
export const isExpoGo = Constants.appOwnership === 'expo';

/**
 * Check if the app is a standalone/production build
 */
export const isStandaloneBuild = Constants.appOwnership === 'standalone';

/**
 * Check if the app is in development mode
 */
export const isDevelopment = __DEV__;

/**
 * Get the execution context for logging
 */
export function getExecutionContext(): string {
  if (isExpoGo) return 'expo-go';
  if (isStandaloneBuild) return 'standalone';
  return 'development';
}

// ============================================================================
// NATIVE MODULE AVAILABILITY
// ============================================================================

type ModuleStatus = {
  available: boolean;
  reason?: string;
};

/**
 * Check if react-native-webrtc is available
 */
export function isWebRTCAvailable(): ModuleStatus {
  if (isExpoGo) {
    return { 
      available: false, 
      reason: 'react-native-webrtc requires custom native code not available in Expo Go' 
    };
  }
  
  if (Platform.OS === 'web') {
    return { available: true }; // Web has built-in WebRTC
  }
  
  try {
    require('react-native-webrtc');
    return { available: true };
  } catch {
    return { 
      available: false, 
      reason: 'react-native-webrtc is not installed' 
    };
  }
}

/**
 * Check if NativeMediaBridge is available
 */
export function isNativeMediaBridgeAvailable(): ModuleStatus {
  if (isExpoGo) {
    return { 
      available: false, 
      reason: 'NativeMediaBridge requires custom native code not available in Expo Go' 
    };
  }
  
  try {
    const { NativeModules } = require('react-native');
    const { requireNativeModule } = require('expo-modules-core');
    const module = NativeModules.NativeMediaBridge || requireNativeModule('NativeMediaBridge');
    return { available: module !== null && module !== undefined };
  } catch {
    return { 
      available: false, 
      reason: 'NativeMediaBridge module is not available' 
    };
  }
}

/**
 * Check if VirtualCamera module is available
 */
export function isVirtualCameraAvailable(): ModuleStatus {
  if (isExpoGo) {
    return { 
      available: false, 
      reason: 'VirtualCamera requires custom native code not available in Expo Go' 
    };
  }
  
  try {
    const VirtualCameraModule = require('../modules/virtual-camera/src/VirtualCameraModule').default;
    return { available: VirtualCameraModule !== null && VirtualCameraModule !== undefined };
  } catch {
    return { 
      available: false, 
      reason: 'VirtualCamera module is not available' 
    };
  }
}

/**
 * Check if WebRTC Loopback module is available
 */
export function isWebRTCLoopbackAvailable(): ModuleStatus {
  if (isExpoGo) {
    return { 
      available: false, 
      reason: 'WebRTC Loopback requires custom native code not available in Expo Go' 
    };
  }
  
  if (Platform.OS !== 'ios') {
    return { 
      available: false, 
      reason: 'WebRTC Loopback is only available on iOS' 
    };
  }
  
  try {
    const { NativeModules } = require('react-native');
    return { available: !!NativeModules.WebRtcLoopback };
  } catch {
    return { 
      available: false, 
      reason: 'WebRtcLoopback module is not available' 
    };
  }
}

// ============================================================================
// PROTOCOL COMPATIBILITY
// ============================================================================

export type ProtocolCompatibility = {
  protocolId: string;
  expoGoCompatible: boolean;
  nativeRequired: boolean;
  webViewBased: boolean;
  fallbackAvailable: boolean;
  notes: string;
};

/**
 * Get compatibility info for all protocols
 */
export function getProtocolCompatibility(): ProtocolCompatibility[] {
  return [
    {
      protocolId: 'standard',
      expoGoCompatible: true,
      nativeRequired: false,
      webViewBased: true,
      fallbackAvailable: true,
      notes: 'Uses WebView JavaScript injection. Fully compatible with Expo Go.',
    },
    {
      protocolId: 'allowlist',
      expoGoCompatible: true,
      nativeRequired: false,
      webViewBased: true,
      fallbackAvailable: true,
      notes: 'Domain-based filtering with Advanced Relay features. WebView-based, Expo Go compatible.',
    },
    {
      protocolId: 'protected',
      expoGoCompatible: true,
      nativeRequired: false,
      webViewBased: true,
      fallbackAvailable: true,
      notes: 'Consent-based preview. Works in Expo Go with limited ML capabilities.',
    },
    {
      protocolId: 'harness',
      expoGoCompatible: true,
      nativeRequired: false,
      webViewBased: true,
      fallbackAvailable: true,
      notes: 'Local test harness. Fully WebView-based, Expo Go compatible.',
    },
    {
      protocolId: 'holographic',
      expoGoCompatible: true,
      nativeRequired: false,
      webViewBased: true,
      fallbackAvailable: true,
      notes: 'WebSocket bridge with canvas rendering. Works in Expo Go.',
    },
    {
      protocolId: 'websocket',
      expoGoCompatible: true,
      nativeRequired: false,
      webViewBased: true,
      fallbackAvailable: true,
      notes: 'PostMessage-based frame streaming. Designed for Expo Go compatibility.',
    },
    {
      protocolId: 'webrtc-loopback',
      expoGoCompatible: false,
      nativeRequired: true,
      webViewBased: false,
      fallbackAvailable: true,
      notes: 'Requires react-native-webrtc and native iOS module. Falls back to websocket protocol in Expo Go.',
    },
  ];
}

/**
 * Check if a specific protocol is compatible with Expo Go
 */
export function isProtocolExpoGoCompatible(protocolId: string): boolean {
  const compatibility = getProtocolCompatibility().find(p => p.protocolId === protocolId);
  return compatibility?.expoGoCompatible ?? false;
}

/**
 * Get the best protocol for current environment
 */
export function getRecommendedProtocol(): string {
  if (isExpoGo) {
    // In Expo Go, use WebSocket bridge (Protocol 6) for best compatibility
    return 'websocket';
  }
  
  if (Platform.OS === 'ios' && isWebRTCLoopbackAvailable().available) {
    // On iOS with native modules, use WebRTC loopback
    return 'webrtc-loopback';
  }
  
  // Default to standard protocol
  return 'standard';
}

/**
 * Get fallback protocol for Expo Go
 */
export function getExpoGoFallbackProtocol(currentProtocol: string): string {
  if (isExpoGo && !isProtocolExpoGoCompatible(currentProtocol)) {
    console.warn(
      `[ExpoGoCompat] Protocol "${currentProtocol}" is not compatible with Expo Go. ` +
      `Falling back to "websocket" protocol.`
    );
    return 'websocket';
  }
  return currentProtocol;
}

// ============================================================================
// FEATURE DETECTION
// ============================================================================

export type FeatureFlags = {
  webrtcNative: boolean;
  nativeMediaBridge: boolean;
  virtualCamera: boolean;
  webrtcLoopback: boolean;
  advancedGPU: boolean;
  mlBodyDetection: boolean;
  enterpriseWebKit: boolean;
  crossDeviceStreaming: boolean;
};

/**
 * Get feature flags based on current environment
 */
export function getFeatureFlags(): FeatureFlags {
  return {
    webrtcNative: !isExpoGo && isWebRTCAvailable().available,
    nativeMediaBridge: !isExpoGo && isNativeMediaBridgeAvailable().available,
    virtualCamera: !isExpoGo && isVirtualCameraAvailable().available,
    webrtcLoopback: !isExpoGo && Platform.OS === 'ios' && isWebRTCLoopbackAvailable().available,
    advancedGPU: !isExpoGo, // GPU shaders may have limitations in Expo Go
    mlBodyDetection: !isExpoGo, // ML requires native modules
    enterpriseWebKit: !isExpoGo && Platform.OS === 'ios',
    crossDeviceStreaming: !isExpoGo, // Requires native networking
  };
}

/**
 * Check if a specific feature is available
 */
export function isFeatureAvailable(feature: keyof FeatureFlags): boolean {
  return getFeatureFlags()[feature];
}

// ============================================================================
// LOGGING AND DEBUGGING
// ============================================================================

/**
 * Log Expo Go compatibility information
 */
export function logCompatibilityInfo(): void {
  console.log('[ExpoGoCompat] ====== Expo Go Compatibility Info ======');
  console.log('[ExpoGoCompat] Execution context:', getExecutionContext());
  console.log('[ExpoGoCompat] Is Expo Go:', isExpoGo);
  console.log('[ExpoGoCompat] Platform:', Platform.OS);
  console.log('[ExpoGoCompat] Development mode:', isDevelopment);
  
  console.log('\n[ExpoGoCompat] Native Module Status:');
  console.log('  - react-native-webrtc:', isWebRTCAvailable().available ? '✓' : '✗', isWebRTCAvailable().reason || '');
  console.log('  - NativeMediaBridge:', isNativeMediaBridgeAvailable().available ? '✓' : '✗', isNativeMediaBridgeAvailable().reason || '');
  console.log('  - VirtualCamera:', isVirtualCameraAvailable().available ? '✓' : '✗', isVirtualCameraAvailable().reason || '');
  console.log('  - WebRTCLoopback:', isWebRTCLoopbackAvailable().available ? '✓' : '✗', isWebRTCLoopbackAvailable().reason || '');
  
  console.log('\n[ExpoGoCompat] Feature Flags:');
  const features = getFeatureFlags();
  Object.entries(features).forEach(([key, value]) => {
    console.log(`  - ${key}:`, value ? '✓' : '✗');
  });
  
  console.log('\n[ExpoGoCompat] Recommended protocol:', getRecommendedProtocol());
  console.log('[ExpoGoCompat] ===========================================');
}

// ============================================================================
// SAFE NATIVE MODULE LOADERS
// ============================================================================

/**
 * Safely load react-native-webrtc
 * Returns null if not available
 */
export function safeLoadWebRTC(): any | null {
  if (isExpoGo || Platform.OS === 'web') {
    return null;
  }
  
  try {
    return require('react-native-webrtc');
  } catch {
    return null;
  }
}

/**
 * Safely load NativeMediaBridge
 * Returns null if not available
 */
export function safeLoadNativeMediaBridge(): any | null {
  if (isExpoGo) {
    return null;
  }
  
  try {
    const { NativeModules } = require('react-native');
    const { requireNativeModule } = require('expo-modules-core');
    return NativeModules.NativeMediaBridge || requireNativeModule('NativeMediaBridge');
  } catch {
    return null;
  }
}

// ============================================================================
// EXPO GO SPECIFIC OPTIMIZATIONS
// ============================================================================

/**
 * Get optimized settings for Expo Go
 */
export function getExpoGoOptimizedSettings() {
  return {
    // Protocol settings
    defaultProtocol: 'websocket',
    
    // Video settings - slightly reduced for performance in Expo Go
    videoWidth: 720,
    videoHeight: 1280,
    videoFps: 24,
    
    // Injection settings
    useCanvasInjection: true,
    useWebSocketBridge: true,
    useNativeBridge: false,
    
    // Feature toggles
    enableGPUProcessing: false, // Disable for Expo Go
    enableMLFeatures: false, // Disable for Expo Go
    enableCrossDevice: false, // Disable for Expo Go
    enableEnterpriseWebKit: false, // Not available in Expo Go
    
    // WebRTC settings
    webrtcEnabled: false,
    requireNativeBridge: false,
    
    // Debugging
    showDebugOverlay: isDevelopment,
    logLevel: isDevelopment ? 'verbose' : 'error',
  };
}

/**
 * Apply Expo Go optimizations to settings
 */
export function applyExpoGoOptimizations<T extends Record<string, any>>(settings: T): T {
  if (!isExpoGo) {
    return settings;
  }
  
  const optimized = getExpoGoOptimizedSettings();
  
  return {
    ...settings,
    ...(settings.webrtc ? {
      webrtc: {
        ...settings.webrtc,
        enabled: false,
      },
    } : {}),
    ...(settings.requireNativeBridge !== undefined ? {
      requireNativeBridge: false,
    } : {}),
    ...(settings.gpu ? {
      gpu: {
        ...settings.gpu,
        enabled: false,
      },
    } : {}),
  };
}

// Export default configuration
export default {
  isExpoGo,
  isStandaloneBuild,
  isDevelopment,
  getExecutionContext,
  getFeatureFlags,
  getProtocolCompatibility,
  getRecommendedProtocol,
  getExpoGoFallbackProtocol,
  getExpoGoOptimizedSettings,
  applyExpoGoOptimizations,
  logCompatibilityInfo,
  safeLoadWebRTC,
  safeLoadNativeMediaBridge,
};
