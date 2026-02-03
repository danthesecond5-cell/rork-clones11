/**
 * Expo Go Compatibility Module
 * 
 * This module provides comprehensive utilities for detecting Expo Go environment
 * and handling compatibility issues with native modules and protocols.
 * 
 * Key Responsibilities:
 * 1. Detect Expo Go vs Custom Development Build
 * 2. Provide safe fallbacks for native-only features
 * 3. Validate protocol availability
 * 4. Log compatibility warnings
 */

import Constants from 'expo-constants';
import { Platform } from 'react-native';

// ============================================================================
// EXPO GO DETECTION
// ============================================================================

/**
 * Check if running in Expo Go (managed workflow without custom native modules)
 */
export const isExpoGo = Constants.appOwnership === 'expo';

/**
 * Check if running in a custom development build
 */
export const isDevBuild = Constants.appOwnership === 'standalone' || 
                          Constants.appOwnership === undefined;

/**
 * Check if running on web platform
 */
export const isWeb = Platform.OS === 'web';

/**
 * Get the current platform information
 */
export const getPlatformInfo = () => ({
  os: Platform.OS,
  version: Platform.Version,
  isExpoGo,
  isDevBuild,
  isWeb,
  appOwnership: Constants.appOwnership,
  expoVersion: Constants.expoVersion,
});

// ============================================================================
// NATIVE MODULE AVAILABILITY
// ============================================================================

/**
 * Check if react-native-webrtc is available
 * This module requires a custom development build
 */
export const isWebRTCNativeAvailable = (): boolean => {
  if (isExpoGo || isWeb) return false;
  
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const webrtc = require('react-native-webrtc');
    return Boolean(webrtc?.RTCPeerConnection);
  } catch {
    return false;
  }
};

/**
 * Check if native media bridge module is available
 */
export const isNativeMediaBridgeAvailable = (): boolean => {
  if (isExpoGo || isWeb) return false;
  
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { NativeModules } = require('react-native');
    return Boolean(NativeModules?.NativeMediaBridge);
  } catch {
    return false;
  }
};

/**
 * Check if WebRTC loopback native module is available
 */
export const isWebRTCLoopbackNativeAvailable = (): boolean => {
  if (isExpoGo || isWeb) return false;
  
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { NativeModules } = require('react-native');
    return Boolean(NativeModules?.WebRtcLoopback);
  } catch {
    return false;
  }
};

// ============================================================================
// PROTOCOL COMPATIBILITY
// ============================================================================

export interface ProtocolCompatibility {
  id: string;
  name: string;
  isAvailable: boolean;
  requiresNative: boolean;
  expoGoFallback: string | null;
  notes: string[];
}

/**
 * Get comprehensive protocol compatibility information
 */
export const getProtocolCompatibility = (): ProtocolCompatibility[] => {
  const protocols: ProtocolCompatibility[] = [
    {
      id: 'standard',
      name: 'Protocol 1: Standard Injection',
      isAvailable: true,
      requiresNative: false,
      expoGoFallback: null,
      notes: [
        'Fully compatible with Expo Go',
        'Uses WebView JavaScript injection',
        'Works on all platforms',
      ],
    },
    {
      id: 'allowlist',
      name: 'Protocol 2: Advanced Relay',
      isAvailable: true,
      requiresNative: false,
      expoGoFallback: null,
      notes: [
        'Core features work in Expo Go',
        'Some WebRTC relay features disabled without native modules',
        'GPU processing limited to web-based canvas',
      ],
    },
    {
      id: 'protected',
      name: 'Protocol 3: Protected Preview',
      isAvailable: true,
      requiresNative: false,
      expoGoFallback: null,
      notes: [
        'Fully compatible with Expo Go',
        'Uses JavaScript-based body detection',
        'Works on all platforms',
      ],
    },
    {
      id: 'harness',
      name: 'Protocol 4: Local Test Harness',
      isAvailable: true,
      requiresNative: false,
      expoGoFallback: null,
      notes: [
        'Fully compatible with Expo Go',
        'Local testing sandbox',
        'Works on all platforms',
      ],
    },
    {
      id: 'holographic',
      name: 'Protocol 5: Holographic Stream',
      isAvailable: true,
      requiresNative: false,
      expoGoFallback: null,
      notes: [
        'Works in Expo Go using postMessage bridge',
        'Canvas-based stream synthesis',
        'SDP manipulation in JavaScript',
      ],
    },
    {
      id: 'websocket',
      name: 'Protocol 6: WebSocket Bridge',
      isAvailable: true,
      requiresNative: false,
      expoGoFallback: null,
      notes: [
        'Fully compatible with Expo Go',
        'Uses postMessage instead of actual WebSockets',
        'Maximum compatibility approach',
      ],
    },
    {
      id: 'webrtc-loopback',
      name: 'Protocol 6: WebRTC Loopback (iOS)',
      isAvailable: !isExpoGo && isWebRTCLoopbackNativeAvailable(),
      requiresNative: true,
      expoGoFallback: 'websocket',
      notes: isExpoGo ? [
        'NOT available in Expo Go',
        'Requires custom development build',
        'Falls back to WebSocket Bridge protocol',
        'Install with: expo prebuild && expo run:ios',
      ] : [
        'Available in custom development build',
        'Uses native WebRTC for iOS',
        'Best quality and lowest latency',
      ],
    },
  ];

  return protocols;
};

/**
 * Check if a specific protocol is available
 */
export const isProtocolAvailable = (protocolId: string): boolean => {
  const protocols = getProtocolCompatibility();
  const protocol = protocols.find(p => p.id === protocolId);
  return protocol?.isAvailable ?? false;
};

/**
 * Get the fallback protocol for an unavailable protocol
 */
export const getProtocolFallback = (protocolId: string): string | null => {
  const protocols = getProtocolCompatibility();
  const protocol = protocols.find(p => p.id === protocolId);
  
  if (!protocol) return null;
  if (protocol.isAvailable) return null;
  
  return protocol.expoGoFallback;
};

/**
 * Get the best available protocol for the current environment
 */
export const getBestAvailableProtocol = (preferredProtocol?: string): string => {
  // If no preference or preference is available, use it
  if (!preferredProtocol || isProtocolAvailable(preferredProtocol)) {
    return preferredProtocol || 'standard';
  }
  
  // Get fallback
  const fallback = getProtocolFallback(preferredProtocol);
  if (fallback && isProtocolAvailable(fallback)) {
    return fallback;
  }
  
  // Default to standard
  return 'standard';
};

// ============================================================================
// SAFE NATIVE MODULE ACCESS
// ============================================================================

/**
 * Safely get a native module with fallback
 */
export function safeRequireNativeModule<T>(
  moduleName: string,
  fallback: T | null = null
): T | null {
  if (isExpoGo || isWeb) {
    console.log(`[ExpoGoCompat] ${moduleName} not available in Expo Go/Web`);
    return fallback;
  }
  
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { NativeModules } = require('react-native');
    const module = NativeModules[moduleName];
    
    if (!module) {
      console.log(`[ExpoGoCompat] ${moduleName} not found in NativeModules`);
      return fallback;
    }
    
    return module as T;
  } catch (error) {
    console.log(`[ExpoGoCompat] Failed to load ${moduleName}:`, error);
    return fallback;
  }
}

/**
 * Safely require react-native-webrtc
 */
export function safeRequireWebRTC(): any {
  if (isExpoGo || isWeb) {
    console.log('[ExpoGoCompat] react-native-webrtc not available in Expo Go/Web');
    return null;
  }
  
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('react-native-webrtc');
  } catch (error) {
    console.log('[ExpoGoCompat] Failed to load react-native-webrtc:', error);
    return null;
  }
}

// ============================================================================
// FEATURE FLAGS
// ============================================================================

export interface FeatureFlags {
  // WebRTC Features
  nativeWebRTC: boolean;
  webRTCLoopback: boolean;
  nativeMediaBridge: boolean;
  
  // Protocol Features
  advancedRelayNative: boolean;
  gpuProcessing: boolean;
  crossDeviceStreaming: boolean;
  
  // General Features
  enterpriseWebKit: boolean;
  ringBufferRecording: boolean;
}

/**
 * Get feature flags based on current environment
 */
export const getFeatureFlags = (): FeatureFlags => {
  const hasNativeWebRTC = isWebRTCNativeAvailable();
  const hasNativeLoopback = isWebRTCLoopbackNativeAvailable();
  const hasNativeMediaBridge = isNativeMediaBridgeAvailable();
  
  return {
    // WebRTC Features - require native modules
    nativeWebRTC: hasNativeWebRTC,
    webRTCLoopback: hasNativeLoopback,
    nativeMediaBridge: hasNativeMediaBridge,
    
    // Protocol Features - partial native support
    advancedRelayNative: hasNativeWebRTC,
    gpuProcessing: !isExpoGo, // WebGL works in dev builds
    crossDeviceStreaming: true, // Works via WebSocket
    
    // General Features
    enterpriseWebKit: !isExpoGo && Platform.OS === 'ios',
    ringBufferRecording: hasNativeLoopback,
  };
};

// ============================================================================
// LOGGING AND DIAGNOSTICS
// ============================================================================

/**
 * Log comprehensive compatibility information
 */
export const logCompatibilityInfo = (): void => {
  const platformInfo = getPlatformInfo();
  const featureFlags = getFeatureFlags();
  const protocols = getProtocolCompatibility();
  
  console.log('====================================');
  console.log('[ExpoGoCompat] COMPATIBILITY REPORT');
  console.log('====================================');
  
  console.log('\n--- Platform Info ---');
  console.log(`  OS: ${platformInfo.os} ${platformInfo.version}`);
  console.log(`  Expo Go: ${platformInfo.isExpoGo ? 'YES' : 'NO'}`);
  console.log(`  Dev Build: ${platformInfo.isDevBuild ? 'YES' : 'NO'}`);
  console.log(`  App Ownership: ${platformInfo.appOwnership || 'undefined'}`);
  
  console.log('\n--- Feature Flags ---');
  Object.entries(featureFlags).forEach(([key, value]) => {
    console.log(`  ${key}: ${value ? '✓' : '✗'}`);
  });
  
  console.log('\n--- Protocol Availability ---');
  protocols.forEach(p => {
    const status = p.isAvailable ? '✓ Available' : '✗ Unavailable';
    const fallback = p.expoGoFallback ? ` → Falls back to: ${p.expoGoFallback}` : '';
    console.log(`  ${p.name}: ${status}${fallback}`);
  });
  
  console.log('\n====================================');
};

/**
 * Get compatibility warnings for display
 */
export const getCompatibilityWarnings = (): string[] => {
  const warnings: string[] = [];
  
  if (isExpoGo) {
    warnings.push('Running in Expo Go - some native features are limited');
    
    if (!isWebRTCNativeAvailable()) {
      warnings.push('WebRTC native module not available - using fallback protocols');
    }
    
    if (!isWebRTCLoopbackNativeAvailable()) {
      warnings.push('WebRTC Loopback not available - falling back to WebSocket Bridge');
    }
  }
  
  return warnings;
};

// ============================================================================
// EXPO GO SAFE WRAPPERS
// ============================================================================

/**
 * Execute a function only if not in Expo Go
 */
export function executeIfNotExpoGo<T>(
  fn: () => T,
  fallback?: T
): T | undefined {
  if (isExpoGo) {
    return fallback;
  }
  return fn();
}

/**
 * Execute a function only if WebRTC is available
 */
export function executeIfWebRTCAvailable<T>(
  fn: (webrtc: any) => T,
  fallback?: T
): T | undefined {
  const webrtc = safeRequireWebRTC();
  if (!webrtc) {
    return fallback;
  }
  return fn(webrtc);
}

// Export default object for convenience
export default {
  isExpoGo,
  isDevBuild,
  isWeb,
  getPlatformInfo,
  isWebRTCNativeAvailable,
  isNativeMediaBridgeAvailable,
  isWebRTCLoopbackNativeAvailable,
  getProtocolCompatibility,
  isProtocolAvailable,
  getProtocolFallback,
  getBestAvailableProtocol,
  safeRequireNativeModule,
  safeRequireWebRTC,
  getFeatureFlags,
  logCompatibilityInfo,
  getCompatibilityWarnings,
  executeIfNotExpoGo,
  executeIfWebRTCAvailable,
};
