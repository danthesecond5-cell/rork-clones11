/**
 * Protocol Settings Types
 * Defines configuration for all 5 testing protocols
 * 
 * Protocol 1: Standard Injection - Basic media injection for internal testing
 * Protocol 2: Allowlist Mode - Domain-restricted injection for safe testing
 * Protocol 3: Protected Preview - Body detection with safe video replacement
 * Protocol 4: Test Harness - Local sandbox for overlay testing
 * Protocol 5: Claude Protocol - Most advanced AI-driven injection system
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

// Protocol 5: Claude Protocol Settings
// The most advanced AI-driven injection protocol with cutting-edge features
export interface ClaudeProtocolSettings {
  enabled: boolean;
  
  // AI-Driven Adaptive Injection
  adaptiveInjection: boolean;
  contextAwareness: boolean; // Adapts to page context
  predictivePreloading: boolean; // Preloads resources before needed
  
  // Advanced Stealth Features
  deepStealthMode: boolean; // Enhanced fingerprint protection
  behavioralMimicry: boolean; // Mimics natural user behavior patterns
  timingRandomization: boolean; // Randomizes API response timing
  
  // Intelligent Quality Control
  aiQualityOptimization: boolean; // ML-based quality adjustments
  dynamicResolutionScaling: boolean;
  frameRateStabilization: boolean;
  
  // Advanced Detection Evasion
  fingerprintMorphing: boolean; // Changes fingerprint over time
  canvasNoiseAdaptation: boolean; // Adapts noise based on detection attempts
  webrtcLeakPrevention: boolean;
  
  // Performance Optimization
  memoryOptimization: boolean;
  gpuAcceleration: boolean;
  workerThreads: boolean; // Use web workers for heavy processing
  
  // Reliability Features
  autoRecovery: boolean; // Automatic recovery from failures
  redundantStreams: boolean; // Backup streams for reliability
  healthMonitoring: boolean;
  
  // Metrics and Telemetry
  advancedMetrics: boolean;
  performanceLogging: boolean;
  anomalyDetection: boolean; // Detect unusual behavior
  
  // Protocol Priority (1-100, higher = more priority)
  priorityLevel: number;
  
  // Injection Mode
  injectionMode: 'aggressive' | 'balanced' | 'conservative' | 'stealth';
  
  // Quality Preset
  qualityPreset: 'maximum' | 'high' | 'balanced' | 'performance';
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

// Default settings for Claude Protocol - the most advanced configuration
export const DEFAULT_CLAUDE_SETTINGS: ClaudeProtocolSettings = {
  enabled: true,
  
  // AI-Driven Adaptive Injection - all enabled by default for maximum capability
  adaptiveInjection: true,
  contextAwareness: true,
  predictivePreloading: true,
  
  // Advanced Stealth Features - full stealth by default
  deepStealthMode: true,
  behavioralMimicry: true,
  timingRandomization: true,
  
  // Intelligent Quality Control
  aiQualityOptimization: true,
  dynamicResolutionScaling: true,
  frameRateStabilization: true,
  
  // Advanced Detection Evasion
  fingerprintMorphing: true,
  canvasNoiseAdaptation: true,
  webrtcLeakPrevention: true,
  
  // Performance Optimization
  memoryOptimization: true,
  gpuAcceleration: true,
  workerThreads: true,
  
  // Reliability Features
  autoRecovery: true,
  redundantStreams: true,
  healthMonitoring: true,
  
  // Metrics and Telemetry
  advancedMetrics: true,
  performanceLogging: true,
  anomalyDetection: true,
  
  // Protocol Priority - highest priority
  priorityLevel: 100,
  
  // Injection Mode - balanced for optimal performance
  injectionMode: 'balanced',
  
  // Quality Preset - maximum quality
  qualityPreset: 'maximum',
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
    description: 'The most advanced AI-driven injection system. Features adaptive injection, deep stealth mode, behavioral mimicry, predictive preloading, intelligent quality optimization, fingerprint morphing, and automatic recovery. Designed by Claude AI to push the boundaries of what\'s possible.',
    enabled: true,
    isLive: true,
    requiresDeveloperMode: true,
  },
};
