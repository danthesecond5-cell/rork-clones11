/**
 * Protocol Settings Types
 * Defines configuration for all 5 testing protocols
 * 
 * Protocol 1: Standard Injection - Uses current media injection flow
 * Protocol 2: Allowlist Test Mode - Domain-restricted injection
 * Protocol 3: Protected Preview - Body detection with safe replacement
 * Protocol 4: Local Test Harness - Sandbox testing environment
 * Protocol 5: Claude Protocol - Advanced AI-driven injection system
 */

export type ProtocolId = 'standard' | 'allowlist' | 'protected' | 'harness' | 'claude';

export interface ProtocolConfig {
  id: ProtocolId;
  name: string;
  description: string;
  enabled: boolean;
  isLive: boolean;
  requiresDeveloperMode: boolean;
}

// Protocol 1: Standard Injection Settings
export interface StandardInjectionSettings {
  enabled: boolean;
  autoInject: boolean;
  stealthByDefault: boolean;
  injectionDelay: number; // ms
  retryOnFail: boolean;
  maxRetries: number;
  loggingLevel: 'none' | 'minimal' | 'verbose';
}

// Protocol 2: Allowlist Mode Settings  
export interface AllowlistSettings {
  enabled: boolean;
  domains: string[];
  blockByDefault: boolean;
  showBlockedNotification: boolean;
  autoAddCurrentSite: boolean;
}

// Protocol 3: Protected Preview Settings
export interface ProtectedPreviewSettings {
  enabled: boolean;
  bodyDetectionSensitivity: 'low' | 'medium' | 'high';
  swapDelayMs: number;
  showOverlayLabel: boolean;
  fallbackToPlaceholder: boolean;
  autoStartCamera: boolean;
}

// Protocol 4: Test Harness Settings
export interface TestHarnessSettings {
  enabled: boolean;
  autoRequestCamera: boolean;
  showDebugOverlay: boolean;
  enableConsoleLogging: boolean;
  simulateLowBandwidth: boolean;
  recordTestResults: boolean;
}

// Protocol 5: Claude Protocol Settings - Advanced AI-driven injection
export interface ClaudeProtocolSettings {
  enabled: boolean;
  // Adaptive Quality System - AI optimizes quality based on conditions
  adaptiveQuality: boolean;
  qualityOptimizationLevel: 'conservative' | 'balanced' | 'aggressive';
  
  // Neural Fingerprint Synthesis - Generate realistic device fingerprints
  neuralFingerprintEnabled: boolean;
  fingerprintVarianceLevel: number; // 0-100, how much variance to add
  
  // Temporal Coherence System - Ensure natural frame transitions
  temporalCoherenceEnabled: boolean;
  frameBlendingStrength: number; // 0-100
  motionPredictionEnabled: boolean;
  
  // Behavioral Mimicry - Simulate human interaction patterns
  behavioralMimicryEnabled: boolean;
  microMovementSimulation: boolean;
  blinkPatternSynthesis: boolean;
  breathingMotionEnabled: boolean;
  
  // Advanced Stealth Features
  antiDetectionLevel: 'minimal' | 'standard' | 'maximum' | 'paranoid';
  dynamicTimingJitter: boolean;
  canvasFingerprintMutation: boolean;
  webglSignatureRandomization: boolean;
  audioContextObfuscation: boolean;
  
  // Context-Aware Injection
  contextAwareEnabled: boolean;
  automaticOrientationMatching: boolean;
  lightingConditionAdaptation: boolean;
  backgroundBlurMatching: boolean;
  
  // Performance Optimizations
  gpuAccelerationEnabled: boolean;
  predictivePrefetching: boolean;
  memoryOptimizationLevel: 'low' | 'medium' | 'high';
  streamPoolingEnabled: boolean;
  maxConcurrentStreams: number;
  
  // Analytics and Debugging
  performanceMetricsEnabled: boolean;
  detailedLogging: boolean;
  anomalyDetectionEnabled: boolean;
  healthCheckInterval: number; // ms
  
  // Fallback Chain - Graceful degradation
  intelligentFallbackEnabled: boolean;
  fallbackChainOrder: ('video' | 'greenscreen' | 'blur' | 'placeholder')[];
}

// Combined Protocol Settings
export interface ProtocolSettings {
  standard: StandardInjectionSettings;
  allowlist: AllowlistSettings;
  protected: ProtectedPreviewSettings;
  harness: TestHarnessSettings;
  claude: ClaudeProtocolSettings;
}

// Developer Mode Settings
export interface DeveloperModeSettings {
  enabled: boolean;
  pinCode: string | null;
  showWatermark: boolean;
  showDebugInfo: boolean;
  allowProtocolEditing: boolean;
  allowAllowlistEditing: boolean;
  bypassSecurityChecks: boolean;
  enableBenchmarkMode: boolean;
  lastEnabledAt: string | null;
}

// Default configurations
export const DEFAULT_STANDARD_SETTINGS: StandardInjectionSettings = {
  enabled: true,
  autoInject: true,
  stealthByDefault: true,
  injectionDelay: 100,
  retryOnFail: true,
  maxRetries: 3,
  loggingLevel: 'minimal',
};

export const DEFAULT_ALLOWLIST_SETTINGS: AllowlistSettings = {
  enabled: false,
  domains: [],
  blockByDefault: true,
  showBlockedNotification: true,
  autoAddCurrentSite: false,
};

export const DEFAULT_PROTECTED_SETTINGS: ProtectedPreviewSettings = {
  enabled: true,
  bodyDetectionSensitivity: 'medium',
  swapDelayMs: 150,
  showOverlayLabel: true,
  fallbackToPlaceholder: true,
  autoStartCamera: true,
};

export const DEFAULT_HARNESS_SETTINGS: TestHarnessSettings = {
  enabled: true,
  autoRequestCamera: true,
  showDebugOverlay: false,
  enableConsoleLogging: true,
  simulateLowBandwidth: false,
  recordTestResults: false,
};

// Claude Protocol - The most advanced AI-driven injection protocol
// Named after Claude (Anthropic's AI) - representing the pinnacle of injection technology
export const DEFAULT_CLAUDE_SETTINGS: ClaudeProtocolSettings = {
  enabled: true,
  
  // Adaptive Quality System
  adaptiveQuality: true,
  qualityOptimizationLevel: 'balanced',
  
  // Neural Fingerprint Synthesis
  neuralFingerprintEnabled: true,
  fingerprintVarianceLevel: 15,
  
  // Temporal Coherence System
  temporalCoherenceEnabled: true,
  frameBlendingStrength: 25,
  motionPredictionEnabled: true,
  
  // Behavioral Mimicry
  behavioralMimicryEnabled: true,
  microMovementSimulation: true,
  blinkPatternSynthesis: true,
  breathingMotionEnabled: true,
  
  // Advanced Stealth Features
  antiDetectionLevel: 'maximum',
  dynamicTimingJitter: true,
  canvasFingerprintMutation: true,
  webglSignatureRandomization: true,
  audioContextObfuscation: true,
  
  // Context-Aware Injection
  contextAwareEnabled: true,
  automaticOrientationMatching: true,
  lightingConditionAdaptation: true,
  backgroundBlurMatching: true,
  
  // Performance Optimizations
  gpuAccelerationEnabled: true,
  predictivePrefetching: true,
  memoryOptimizationLevel: 'high',
  streamPoolingEnabled: true,
  maxConcurrentStreams: 3,
  
  // Analytics and Debugging
  performanceMetricsEnabled: true,
  detailedLogging: false,
  anomalyDetectionEnabled: true,
  healthCheckInterval: 5000,
  
  // Fallback Chain
  intelligentFallbackEnabled: true,
  fallbackChainOrder: ['video', 'greenscreen', 'blur', 'placeholder'],
};

export const DEFAULT_PROTOCOL_SETTINGS: ProtocolSettings = {
  standard: DEFAULT_STANDARD_SETTINGS,
  allowlist: DEFAULT_ALLOWLIST_SETTINGS,
  protected: DEFAULT_PROTECTED_SETTINGS,
  harness: DEFAULT_HARNESS_SETTINGS,
  claude: DEFAULT_CLAUDE_SETTINGS,
};

export const DEFAULT_DEVELOPER_MODE: DeveloperModeSettings = {
  // For safety in wider testing, developer mode defaults to disabled.
  enabled: false,
  // Default PIN requested by you: '0000'
  pinCode: '0000',
  showWatermark: true,
  showDebugInfo: false,
  allowProtocolEditing: true,
  allowAllowlistEditing: true,
  bypassSecurityChecks: false,
  enableBenchmarkMode: false,
  lastEnabledAt: null,
};

// Protocol metadata for UI display
export const PROTOCOL_METADATA: Record<ProtocolId, ProtocolConfig> = {
  standard: {
    id: 'standard',
    name: 'Protocol 1: Standard Injection',
    description: 'Uses the current media injection flow inside this app for internal testing and controlled environments.',
    enabled: true,
    isLive: true,
    requiresDeveloperMode: false,
  },
  allowlist: {
    id: 'allowlist',
    name: 'Protocol 2: Allowlist Test Mode',
    description: 'Limits injection to domains you explicitly allow. Recommended for safe testing. Editing requires Developer Mode.',
    enabled: true,
    isLive: true,
    requiresDeveloperMode: true,
  },
  protected: {
    id: 'protected',
    name: 'Protocol 3: Protected Preview',
    description: 'A consent-based local preview that swaps to a safe looping video whenever body detection is triggered.',
    enabled: true,
    isLive: true,
    requiresDeveloperMode: false,
  },
  harness: {
    id: 'harness',
    name: 'Protocol 4: Local Test Harness',
    description: 'A local sandbox page for safe overlay testing without touching third-party sites.',
    enabled: true,
    isLive: true,
    requiresDeveloperMode: false,
  },
  claude: {
    id: 'claude',
    name: 'Protocol 5: Claude Protocol',
    description: 'Advanced AI-driven injection system with neural fingerprinting, behavioral mimicry, temporal coherence, and intelligent anti-detection. Represents the most sophisticated approach to camera simulation.',
    enabled: true,
    isLive: true,
    requiresDeveloperMode: true,
  },
};
