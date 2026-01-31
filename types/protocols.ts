/**
 * Protocol Settings Types
 * Defines configuration for all testing protocols
 */

export type ProtocolId = 'standard' | 'allowlist' | 'protected' | 'harness' | 'sonnet';

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

// Protocol 5: Sonnet Protocol Settings (Advanced AI-Optimized)
export interface SonnetProtocolSettings {
  enabled: boolean;
  // Adaptive Intelligence
  aiOptimizationLevel: 'conservative' | 'balanced' | 'aggressive' | 'experimental';
  dynamicQualityAdaptation: boolean;
  predictivePreloading: boolean;
  intelligentCaching: boolean;
  
  // Advanced Stealth
  hyperStealthMode: boolean;
  fingerprintRotation: boolean;
  behavioralMimicry: boolean;
  timingRandomization: boolean;
  
  // Performance Optimization
  gpuAcceleration: boolean;
  multiThreadedProcessing: boolean;
  memoryOptimization: boolean;
  bandwidthThrottling: boolean;
  
  // Security & Safety
  anomalyDetection: boolean;
  realTimeValidation: boolean;
  automaticFallback: boolean;
  encryptedStreaming: boolean;
  
  // Advanced Features
  contextAwareness: boolean;
  adaptiveFrameRate: boolean;
  smartBuffering: boolean;
  edgeCaseHandling: boolean;
  
  // Monitoring & Analytics
  telemetryEnabled: boolean;
  performanceMetrics: boolean;
  errorPrediction: boolean;
  selfHealing: boolean;
}

// Combined Protocol Settings
export interface ProtocolSettings {
  standard: StandardInjectionSettings;
  allowlist: AllowlistSettings;
  protected: ProtectedPreviewSettings;
  harness: TestHarnessSettings;
  sonnet: SonnetProtocolSettings;
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

export const DEFAULT_SONNET_SETTINGS: SonnetProtocolSettings = {
  enabled: true,
  // Adaptive Intelligence - Balanced by default for optimal performance
  aiOptimizationLevel: 'balanced',
  dynamicQualityAdaptation: true,
  predictivePreloading: true,
  intelligentCaching: true,
  
  // Advanced Stealth - Maximum stealth capabilities
  hyperStealthMode: true,
  fingerprintRotation: true,
  behavioralMimicry: true,
  timingRandomization: true,
  
  // Performance Optimization - All enabled for best experience
  gpuAcceleration: true,
  multiThreadedProcessing: true,
  memoryOptimization: true,
  bandwidthThrottling: false,
  
  // Security & Safety - Full protection enabled
  anomalyDetection: true,
  realTimeValidation: true,
  automaticFallback: true,
  encryptedStreaming: false, // Disabled by default (requires setup)
  
  // Advanced Features - Intelligent adaptation
  contextAwareness: true,
  adaptiveFrameRate: true,
  smartBuffering: true,
  edgeCaseHandling: true,
  
  // Monitoring & Analytics - Full telemetry
  telemetryEnabled: true,
  performanceMetrics: true,
  errorPrediction: true,
  selfHealing: true,
};

export const DEFAULT_PROTOCOL_SETTINGS: ProtocolSettings = {
  standard: DEFAULT_STANDARD_SETTINGS,
  allowlist: DEFAULT_ALLOWLIST_SETTINGS,
  protected: DEFAULT_PROTECTED_SETTINGS,
  harness: DEFAULT_HARNESS_SETTINGS,
  sonnet: DEFAULT_SONNET_SETTINGS,
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
  sonnet: {
    id: 'sonnet',
    name: 'Protocol 5: Sonnet Adaptive Intelligence',
    description: 'Advanced AI-optimized protocol with hyper-stealth capabilities, predictive adaptation, and self-healing mechanisms. The most sophisticated injection system combining all advanced features.',
    enabled: true,
    isLive: true,
    requiresDeveloperMode: true,
  },
};
