export interface DeviceFingerprintProfile {
  navigator: {
    userAgent: string;
    platform: string;
    vendor: string;
    language: string;
    languages: string[];
    hardwareConcurrency: number;
    deviceMemory: number;
    maxTouchPoints: number;
  };
  screen: {
    width: number;
    height: number;
    availWidth: number;
    availHeight: number;
    colorDepth: number;
    pixelDepth: number;
    devicePixelRatio: number;
  };
  webgl: {
    vendor: string;
    renderer: string;
    version: string;
    shadingLanguageVersion: string;
    unmaskedVendor: string;
    unmaskedRenderer: string;
  };
  mediaCapabilities: {
    facingMode: 'user' | 'environment';
    frameRate: { min: number; max: number; ideal: number };
    width: { min: number; max: number; ideal: number };
    height: { min: number; max: number; ideal: number };
    aspectRatio: { min: number; max: number; ideal: number };
    resizeMode: string[];
    echoCancellation: boolean;
    autoGainControl: boolean;
    noiseSuppression: boolean;
    sampleRate: number;
    sampleSize: number;
    channelCount: number;
  };
  audio: {
    sampleRate: number;
    maxChannelCount: number;
    numberOfInputs: number;
    numberOfOutputs: number;
    channelCountMode: string;
    channelInterpretation: string;
  };
  battery: {
    charging: boolean;
    chargingTime: number;
    dischargingTime: number;
    level: number;
  };
  fonts: string[];
}

export const IPHONE_15_PRO_PROFILE: DeviceFingerprintProfile = {
  navigator: {
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
    platform: 'iPhone',
    vendor: 'Apple Computer, Inc.',
    language: 'en-US',
    languages: ['en-US', 'en'],
    hardwareConcurrency: 6,
    deviceMemory: 8,
    maxTouchPoints: 5,
  },
  screen: {
    width: 393,
    height: 852,
    availWidth: 393,
    availHeight: 852,
    colorDepth: 24,
    pixelDepth: 24,
    devicePixelRatio: 3,
  },
  webgl: {
    vendor: 'WebKit',
    renderer: 'WebKit WebGL',
    version: 'WebGL 2.0 (OpenGL ES 3.0)',
    shadingLanguageVersion: 'WebGL GLSL ES 3.00',
    unmaskedVendor: 'Apple Inc.',
    unmaskedRenderer: 'Apple GPU',
  },
  mediaCapabilities: {
    facingMode: 'user',
    frameRate: { min: 1, max: 60, ideal: 30 },
    width: { min: 1, max: 4032, ideal: 1080 },
    height: { min: 1, max: 3024, ideal: 1920 },
    aspectRatio: { min: 0.5, max: 2.0, ideal: 0.5625 },
    resizeMode: ['none', 'crop-and-scale'],
    echoCancellation: true,
    autoGainControl: true,
    noiseSuppression: true,
    sampleRate: 48000,
    sampleSize: 16,
    channelCount: 1,
  },
  audio: {
    sampleRate: 48000,
    maxChannelCount: 2,
    numberOfInputs: 1,
    numberOfOutputs: 1,
    channelCountMode: 'explicit',
    channelInterpretation: 'speakers',
  },
  battery: {
    charging: false,
    chargingTime: Infinity,
    dischargingTime: 28800,
    level: 0.85,
  },
  fonts: [
    'Arial',
    'Helvetica',
    'Helvetica Neue',
    'Times New Roman',
    'Georgia',
    'Verdana',
    'Courier New',
    'SF Pro Display',
    'SF Pro Text',
    'SF Mono',
  ],
};

export const IPHONE_14_PROFILE: DeviceFingerprintProfile = {
  navigator: {
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Mobile/15E148 Safari/604.1',
    platform: 'iPhone',
    vendor: 'Apple Computer, Inc.',
    language: 'en-US',
    languages: ['en-US', 'en'],
    hardwareConcurrency: 6,
    deviceMemory: 6,
    maxTouchPoints: 5,
  },
  screen: {
    width: 390,
    height: 844,
    availWidth: 390,
    availHeight: 844,
    colorDepth: 24,
    pixelDepth: 24,
    devicePixelRatio: 3,
  },
  webgl: {
    vendor: 'WebKit',
    renderer: 'WebKit WebGL',
    version: 'WebGL 2.0 (OpenGL ES 3.0)',
    shadingLanguageVersion: 'WebGL GLSL ES 3.00',
    unmaskedVendor: 'Apple Inc.',
    unmaskedRenderer: 'Apple GPU',
  },
  mediaCapabilities: {
    facingMode: 'user',
    frameRate: { min: 1, max: 60, ideal: 30 },
    width: { min: 1, max: 4032, ideal: 1080 },
    height: { min: 1, max: 3024, ideal: 1920 },
    aspectRatio: { min: 0.5, max: 2.0, ideal: 0.5625 },
    resizeMode: ['none', 'crop-and-scale'],
    echoCancellation: true,
    autoGainControl: true,
    noiseSuppression: true,
    sampleRate: 48000,
    sampleSize: 16,
    channelCount: 1,
  },
  audio: {
    sampleRate: 48000,
    maxChannelCount: 2,
    numberOfInputs: 1,
    numberOfOutputs: 1,
    channelCountMode: 'explicit',
    channelInterpretation: 'speakers',
  },
  battery: {
    charging: true,
    chargingTime: 3600,
    dischargingTime: Infinity,
    level: 0.72,
  },
  fonts: [
    'Arial',
    'Helvetica',
    'Helvetica Neue',
    'Times New Roman',
    'Georgia',
    'Verdana',
    'Courier New',
    'SF Pro Display',
    'SF Pro Text',
  ],
};

export interface VideoNaturalVariation {
  brightnessJitter: { min: number; max: number; frequency: number };
  colorTemperatureShift: { min: number; max: number; frequency: number };
  microShake: { amplitude: number; frequency: number };
  frameDropProbability: number;
  autoExposureDelay: number;
  autoFocusHuntProbability: number;
  sensorNoise: { intensity: number; grain: number };
  rollingShutterEffect: boolean;
  lensDistortion: { k1: number; k2: number };
}

export const NATURAL_CAMERA_VARIATIONS: VideoNaturalVariation = {
  brightnessJitter: { min: -0.02, max: 0.02, frequency: 0.3 },
  colorTemperatureShift: { min: -50, max: 50, frequency: 0.1 },
  microShake: { amplitude: 0.5, frequency: 2.0 },
  frameDropProbability: 0.001,
  autoExposureDelay: 150,
  autoFocusHuntProbability: 0.0005,
  sensorNoise: { intensity: 0.008, grain: 0.003 },
  rollingShutterEffect: false,
  lensDistortion: { k1: 0.0, k2: 0.0 },
};

export interface TimingProfile {
  getUserMediaDelay: { min: number; max: number };
  enumerateDevicesDelay: { min: number; max: number };
  trackStartDelay: { min: number; max: number };
  capabilitiesQueryDelay: { min: number; max: number };
  settingsQueryDelay: { min: number; max: number };
  frameIntervalJitter: number;
}

export const REALISTIC_TIMING: TimingProfile = {
  getUserMediaDelay: { min: 180, max: 450 },
  enumerateDevicesDelay: { min: 5, max: 25 },
  trackStartDelay: { min: 50, max: 150 },
  capabilitiesQueryDelay: { min: 1, max: 5 },
  settingsQueryDelay: { min: 1, max: 3 },
  frameIntervalJitter: 2.0,
};

export interface WebRTCStealthConfig {
  blockLocalIPs: boolean;
  spoofPublicIP: boolean;
  spoofedIP: string;
  disableSTUN: boolean;
  disableTURN: boolean;
  modifySDPFingerprint: boolean;
  randomizeCandidatePriority: boolean;
}

export const WEBRTC_STEALTH_CONFIG: WebRTCStealthConfig = {
  blockLocalIPs: true,
  spoofPublicIP: false,
  spoofedIP: '',
  disableSTUN: false,
  disableTURN: false,
  modifySDPFingerprint: true,
  randomizeCandidatePriority: true,
};

export interface CanvasStealthConfig {
  addNoise: boolean;
  noiseIntensity: number;
  modifyGetImageData: boolean;
  modifyToDataURL: boolean;
  modifyToBlob: boolean;
  consistentNoiseSeed: boolean;
}

export const CANVAS_STEALTH_CONFIG: CanvasStealthConfig = {
  addNoise: true,
  noiseIntensity: 0.005,
  modifyGetImageData: true,
  modifyToDataURL: true,
  modifyToBlob: true,
  consistentNoiseSeed: true,
};

export interface AudioStealthConfig {
  modifyAnalyserNode: boolean;
  modifyOscillator: boolean;
  addMicroVariations: boolean;
  spoofSampleRate: boolean;
  targetSampleRate: number;
}

export const AUDIO_STEALTH_CONFIG: AudioStealthConfig = {
  modifyAnalyserNode: true,
  modifyOscillator: true,
  addMicroVariations: true,
  spoofSampleRate: true,
  targetSampleRate: 48000,
};

export const STEALTH_DETECTION_CHECKS = [
  'webdriver',
  'selenium',
  'phantom',
  'nightmare',
  'puppeteer',
  'playwright',
  'cypress',
  'chromedriver',
  'automationProtocol',
  '__webdriver_script_fn',
  '__driver_evaluate',
  '__webdriver_evaluate',
  '__selenium_evaluate',
  '__fxdriver_evaluate',
  '__driver_unwrapped',
  '__webdriver_unwrapped',
  '__selenium_unwrapped',
  '__fxdriver_unwrapped',
  '_Selenium_IDE_Recorder',
  '_selenium',
  'calledSelenium',
  '$cdc_',
  '$chrome_',
  '__nightmare',
  '__puppeteer',
  'domAutomation',
  'domAutomationController',
];

export const PROPERTIES_TO_DELETE = [
  'cdc_adoQpoasnfa76pfcZLmcfl_Array',
  'cdc_adoQpoasnfa76pfcZLmcfl_Promise',
  'cdc_adoQpoasnfa76pfcZLmcfl_Symbol',
  'cdc_adoQpoasnfa76pfcZLmcfl_JSON',
  'cdc_adoQpoasnfa76pfcZLmcfl_Object',
  'cdc_adoQpoasnfa76pfcZLmcfl_Proxy',
  '__webdriver_script_fn',
  '__driver_evaluate',
  '__webdriver_evaluate',
  '__selenium_evaluate',
  '__fxdriver_evaluate',
  '__driver_unwrapped',
  '__webdriver_unwrapped',
  '__selenium_unwrapped',
  '__fxdriver_unwrapped',
  '_Selenium_IDE_Recorder',
  '_selenium',
  'calledSelenium',
];

export function getRandomDelay(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function addNaturalJitter(value: number, jitterPercent: number): number {
  const jitter = value * (jitterPercent / 100) * (Math.random() * 2 - 1);
  return value + jitter;
}

export function generateConsistentNoise(seed: number, x: number, y: number): number {
  const n = Math.sin(seed * 12.9898 + x * 78.233 + y * 43.1234) * 43758.5453;
  return n - Math.floor(n);
}

// ============ CLAUDE PROTOCOL ADVANCED STEALTH CONFIGURATIONS ============

/**
 * Quantum Fingerprint Evasion Configuration
 * Uses multiple layers of obfuscation to prevent fingerprinting
 */
export interface QuantumFingerprintConfig {
  enabled: boolean;
  // Multi-layer canvas noise with Perlin-like patterns
  perlinCanvasNoise: boolean;
  canvasNoiseOctaves: number;
  canvasNoisePersistence: number;
  // WebGL advanced spoofing
  webglParameterFuzzing: boolean;
  webglShaderNoise: boolean;
  webglExtensionRandomization: boolean;
  // Audio fingerprint advanced evasion
  audioContextNoise: boolean;
  audioOscillatorDrift: boolean;
  audioTimingRandomization: boolean;
  // Font fingerprint evasion
  fontEnumerationSpoofing: boolean;
  fontMetricFuzzing: boolean;
  // Hardware fingerprint evasion
  hardwareConcurrencyJitter: boolean;
  deviceMemoryJitter: boolean;
  // WebRTC advanced protection
  webrtcIceCandidateFiltering: boolean;
  webrtcSdpMangling: boolean;
  webrtcDtlsFingerprintRandomization: boolean;
}

export const QUANTUM_FINGERPRINT_CONFIG: QuantumFingerprintConfig = {
  enabled: true,
  perlinCanvasNoise: true,
  canvasNoiseOctaves: 4,
  canvasNoisePersistence: 0.5,
  webglParameterFuzzing: true,
  webglShaderNoise: true,
  webglExtensionRandomization: true,
  audioContextNoise: true,
  audioOscillatorDrift: true,
  audioTimingRandomization: true,
  fontEnumerationSpoofing: true,
  fontMetricFuzzing: true,
  hardwareConcurrencyJitter: true,
  deviceMemoryJitter: true,
  webrtcIceCandidateFiltering: true,
  webrtcSdpMangling: true,
  webrtcDtlsFingerprintRandomization: true,
};

/**
 * Behavioral Mimicry Configuration
 * Simulates human-like interaction patterns
 */
export interface BehavioralMimicryConfig {
  enabled: boolean;
  // Mouse movement simulation
  mouseMovementNaturalization: boolean;
  mouseMicroJitter: boolean;
  mouseAccelerationCurves: boolean;
  // Keyboard simulation
  keyboardTimingVariation: boolean;
  keystrokeDynamics: boolean;
  // Scroll behavior
  scrollInertiaSimulation: boolean;
  scrollMomentum: boolean;
  // Touch simulation
  touchPressureVariation: boolean;
  touchAreaVariation: boolean;
  // Timing humanization
  inputDelayHumanization: boolean;
  reactionTimeVariation: boolean;
  // Attention patterns
  focusBlurPatterns: boolean;
  viewportAttentionTracking: boolean;
}

export const BEHAVIORAL_MIMICRY_CONFIG: BehavioralMimicryConfig = {
  enabled: true,
  mouseMovementNaturalization: true,
  mouseMicroJitter: true,
  mouseAccelerationCurves: true,
  keyboardTimingVariation: true,
  keystrokeDynamics: true,
  scrollInertiaSimulation: true,
  scrollMomentum: true,
  touchPressureVariation: true,
  touchAreaVariation: true,
  inputDelayHumanization: true,
  reactionTimeVariation: true,
  focusBlurPatterns: true,
  viewportAttentionTracking: true,
};

/**
 * Advanced Timing Profile with Jitter
 * Mimics real device timing characteristics with natural variation
 */
export interface AdvancedTimingProfile extends TimingProfile {
  // Additional timing for Claude protocol
  permissionQueryDelay: { min: number; max: number };
  streamInitializationDelay: { min: number; max: number };
  constraintProcessingDelay: { min: number; max: number };
  deviceLabelRevealDelay: { min: number; max: number };
  // Natural timing patterns
  firstFrameDelay: { min: number; max: number };
  videoLoadingJitter: number;
  audioSyncOffset: { min: number; max: number };
  // Performance timing
  gcPauseSimulation: boolean;
  gcPauseFrequency: number;
  gcPauseDuration: { min: number; max: number };
}

export const CLAUDE_TIMING_PROFILE: AdvancedTimingProfile = {
  // Base timing
  getUserMediaDelay: { min: 200, max: 550 },
  enumerateDevicesDelay: { min: 8, max: 35 },
  trackStartDelay: { min: 60, max: 180 },
  capabilitiesQueryDelay: { min: 2, max: 8 },
  settingsQueryDelay: { min: 1, max: 5 },
  frameIntervalJitter: 2.5,
  // Extended timing
  permissionQueryDelay: { min: 15, max: 45 },
  streamInitializationDelay: { min: 80, max: 200 },
  constraintProcessingDelay: { min: 5, max: 25 },
  deviceLabelRevealDelay: { min: 50, max: 150 },
  // Natural timing
  firstFrameDelay: { min: 100, max: 300 },
  videoLoadingJitter: 3.0,
  audioSyncOffset: { min: -5, max: 5 },
  // Performance
  gcPauseSimulation: true,
  gcPauseFrequency: 0.02,
  gcPauseDuration: { min: 5, max: 25 },
};

/**
 * Neural Video Enhancement Configuration
 * AI-driven video quality optimization
 */
export interface NeuralVideoEnhancementConfig {
  enabled: boolean;
  // Frame interpolation
  frameInterpolation: boolean;
  interpolationMethod: 'linear' | 'cubic' | 'neural';
  targetFrameRate: number;
  // Super resolution
  superResolution: boolean;
  upscaleFactor: number;
  // Color enhancement
  colorCorrection: boolean;
  contrastEnhancement: boolean;
  saturationOptimization: boolean;
  // Noise reduction
  temporalNoiseReduction: boolean;
  spatialNoiseReduction: boolean;
  noiseReductionStrength: number;
  // Lighting adaptation
  autoExposureSimulation: boolean;
  whitBalanceCorrection: boolean;
  hdrToneMapping: boolean;
  // Motion enhancement
  motionBlurReduction: boolean;
  stabilizationSimulation: boolean;
}

export const NEURAL_VIDEO_ENHANCEMENT_CONFIG: NeuralVideoEnhancementConfig = {
  enabled: true,
  frameInterpolation: true,
  interpolationMethod: 'cubic',
  targetFrameRate: 30,
  superResolution: false,
  upscaleFactor: 2,
  colorCorrection: true,
  contrastEnhancement: true,
  saturationOptimization: true,
  temporalNoiseReduction: true,
  spatialNoiseReduction: true,
  noiseReductionStrength: 0.3,
  autoExposureSimulation: true,
  whitBalanceCorrection: true,
  hdrToneMapping: false,
  motionBlurReduction: true,
  stabilizationSimulation: true,
};

/**
 * Adaptive Performance Configuration
 * Dynamic resource management based on device capabilities
 */
export interface AdaptivePerformanceConfig {
  enabled: boolean;
  // GPU optimization
  gpuAcceleration: boolean;
  webglOptimization: boolean;
  offscreenCanvasEnabled: boolean;
  // Memory management
  memoryMonitoring: boolean;
  memoryThresholdMB: number;
  aggressiveGCOnThreshold: boolean;
  // Frame rate adaptation
  adaptiveFrameRate: boolean;
  minFrameRate: number;
  maxFrameRate: number;
  frameRateStepSize: number;
  // Quality scaling
  qualityScaling: boolean;
  qualityScaleMin: number;
  qualityScaleMax: number;
  qualityScaleStep: number;
  // Power efficiency
  powerEfficiencyMode: boolean;
  reducedPowerFrameRate: number;
  batteryThreshold: number;
  // Network adaptation
  networkAdaptation: boolean;
  bandwidthSampling: boolean;
  adaptiveBuffering: boolean;
}

export const ADAPTIVE_PERFORMANCE_CONFIG: AdaptivePerformanceConfig = {
  enabled: true,
  gpuAcceleration: true,
  webglOptimization: true,
  offscreenCanvasEnabled: true,
  memoryMonitoring: true,
  memoryThresholdMB: 150,
  aggressiveGCOnThreshold: true,
  adaptiveFrameRate: true,
  minFrameRate: 15,
  maxFrameRate: 60,
  frameRateStepSize: 5,
  qualityScaling: true,
  qualityScaleMin: 0.5,
  qualityScaleMax: 1.0,
  qualityScaleStep: 0.1,
  powerEfficiencyMode: false,
  reducedPowerFrameRate: 24,
  batteryThreshold: 0.2,
  networkAdaptation: true,
  bandwidthSampling: true,
  adaptiveBuffering: true,
};

/**
 * Context-Aware Injection Configuration
 * Intelligent scene analysis and adaptation
 */
export interface ContextAwareInjectionConfig {
  enabled: boolean;
  // Scene analysis
  sceneDetection: boolean;
  lightingAnalysis: boolean;
  motionDetection: boolean;
  faceDetectionAwareness: boolean;
  // Adaptive behavior
  adaptToSceneLighting: boolean;
  matchBackgroundMotion: boolean;
  syncWithAudioContext: boolean;
  // Seamless transitions
  transitionSmoothing: boolean;
  transitionDuration: number;
  blendMode: 'instant' | 'fade' | 'crossfade' | 'morph';
  // Environment matching
  colorTemperatureMatching: boolean;
  exposureMatching: boolean;
  contrastMatching: boolean;
}

export const CONTEXT_AWARE_INJECTION_CONFIG: ContextAwareInjectionConfig = {
  enabled: true,
  sceneDetection: true,
  lightingAnalysis: true,
  motionDetection: true,
  faceDetectionAwareness: true,
  adaptToSceneLighting: true,
  matchBackgroundMotion: true,
  syncWithAudioContext: true,
  transitionSmoothing: true,
  transitionDuration: 200,
  blendMode: 'crossfade',
  colorTemperatureMatching: true,
  exposureMatching: true,
  contrastMatching: true,
};

// ============ ADVANCED DETECTION EVASION ============

/**
 * Extended list of automation detection markers to clean
 */
export const EXTENDED_STEALTH_DETECTION_CHECKS = [
  ...STEALTH_DETECTION_CHECKS,
  // Additional modern detection markers
  'HeadlessChrome',
  'Chrome-Lighthouse',
  '__BROWSERLESS_BROWSER__',
  '__TESTING_FRAMEWORK__',
  '__AUTOMATION_CONTROLLER__',
  '_phantom',
  '__phantomas',
  'Buffer',
  'emit',
  'spawn',
  'webdriver',
  'domAutomation',
  'callPhantom',
  '__commandLineAPI',
  '__webdriver_script_fn',
  '_Selenium_IDE_Recorder',
  '__nightmare',
  '__puppeteer_evaluation_script__',
  '__lastWatirAlert',
  '__lastWatirConfirm',
  '__lastWatirPrompt',
  '_WEBDRIVER_ELEM_CACHE',
  'ChromeDriverw',
  'driver-evaluate',
  'webdriver-evaluate',
  'selenium-evaluate',
  'webdriverCommand',
  'selenium',
  '_cdp',
  'cdc_adoQpoasnfa76pfcZLmcfl_',
  '$cdc_asdjflasutopfhvcZLmcfl_',
  '__webdriverFunc',
  '_webdriverFunc',
];

/**
 * Extended properties to delete for advanced evasion
 */
export const EXTENDED_PROPERTIES_TO_DELETE = [
  ...PROPERTIES_TO_DELETE,
  '__webdriverFunc',
  '_webdriverFunc',
  '__lastWatirAlert',
  '__lastWatirConfirm',
  '__lastWatirPrompt',
  '_WEBDRIVER_ELEM_CACHE',
  'webdriverCommand',
  '__commandLineAPI',
  '_cdp',
  '__cdp',
  'Runtime',
  'Debugger',
  '__crWeb',
  '__gCrWeb',
];

// ============ PERLIN NOISE GENERATOR FOR NATURAL VARIATIONS ============

/**
 * Simplified Perlin noise generator for natural-looking variations
 */
export function perlinNoise2D(x: number, y: number, seed: number = 0): number {
  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  const lerp = (a: number, b: number, t: number) => a + t * (b - a);
  const grad = (hash: number, x: number, y: number) => {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : 0;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  };

  const xi = Math.floor(x) & 255;
  const yi = Math.floor(y) & 255;
  const xf = x - Math.floor(x);
  const yf = y - Math.floor(y);

  const u = fade(xf);
  const v = fade(yf);

  // Pseudo-random permutation based on seed
  const perm = (n: number) => {
    const hash = Math.sin(n * 127.1 + seed * 311.7) * 43758.5453;
    return Math.floor((hash - Math.floor(hash)) * 256);
  };

  const aa = perm(perm(xi) + yi);
  const ab = perm(perm(xi) + yi + 1);
  const ba = perm(perm(xi + 1) + yi);
  const bb = perm(perm(xi + 1) + yi + 1);

  const x1 = lerp(grad(aa, xf, yf), grad(ba, xf - 1, yf), u);
  const x2 = lerp(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u);

  return (lerp(x1, x2, v) + 1) / 2;
}

/**
 * Generate fractal Brownian motion noise for more natural patterns
 */
export function fbmNoise2D(
  x: number,
  y: number,
  octaves: number = 4,
  persistence: number = 0.5,
  seed: number = 0
): number {
  let total = 0;
  let frequency = 1;
  let amplitude = 1;
  let maxValue = 0;

  for (let i = 0; i < octaves; i++) {
    total += perlinNoise2D(x * frequency, y * frequency, seed + i) * amplitude;
    maxValue += amplitude;
    amplitude *= persistence;
    frequency *= 2;
  }

  return total / maxValue;
}

/**
 * Generate human-like timing variation using Gaussian distribution
 */
export function gaussianRandom(mean: number, stdDev: number): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * stdDev + mean;
}

/**
 * Generate timing that mimics human reaction patterns
 */
export function humanReactionDelay(baseDelay: number, variability: number = 0.3): number {
  // Human reactions follow a log-normal distribution
  const logMean = Math.log(baseDelay);
  const logStdDev = variability;
  return Math.exp(gaussianRandom(logMean, logStdDev));
}

/**
 * Simulate natural hand tremor for micro-movements
 */
export function handTremorOffset(time: number, intensity: number = 1): { x: number; y: number } {
  // Combine multiple frequencies for realistic tremor
  const freq1 = 8.5; // Primary tremor frequency (Hz)
  const freq2 = 12.3; // Secondary frequency
  const freq3 = 4.2; // Low frequency drift

  const x = (
    Math.sin(time * freq1 * 2 * Math.PI) * 0.5 +
    Math.sin(time * freq2 * 2 * Math.PI) * 0.3 +
    Math.sin(time * freq3 * 2 * Math.PI) * 0.2
  ) * intensity;

  const y = (
    Math.cos(time * freq1 * 2 * Math.PI + 0.5) * 0.5 +
    Math.cos(time * freq2 * 2 * Math.PI + 1.2) * 0.3 +
    Math.cos(time * freq3 * 2 * Math.PI + 0.8) * 0.2
  ) * intensity;

  return { x, y };
}
