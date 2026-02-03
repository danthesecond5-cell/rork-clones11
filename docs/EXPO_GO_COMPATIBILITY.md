# Expo Go Compatibility Guide

## Overview

This document outlines the Expo Go compatibility strategy for the rork-clones11 application. The codebase has been fully optimized to work seamlessly in both Expo Go and development builds, with graceful fallbacks for native-dependent features.

## Quick Summary

✅ **Fully Compatible Protocols in Expo Go:**
- Protocol 1: Standard Injection
- Protocol 2: Advanced Relay (Allowlist Protocol)
- Protocol 3: Protected Preview
- Protocol 4: Local Test Harness
- Protocol 5: Holographic Stream Injection
- Protocol 6: WebSocket Bridge

⚠️ **Limited Compatibility (Graceful Fallback):**
- Protocol 6: WebRTC Loopback (requires custom native modules)
- VirtualCamera module (requires custom native modules)
- Enterprise WebKit features (iOS only, not in Expo Go)

## Architecture Changes

### 1. Expo Go Detection

All native module loading now includes Expo Go detection:

```typescript
import Constants from 'expo-constants';

const isExpoGo = Constants.appOwnership === 'expo';
```

This flag is used throughout the codebase to:
- Skip native module initialization in Expo Go
- Provide informative error messages
- Enable alternative implementations
- Disable incompatible features by default

### 2. Native Module Graceful Fallbacks

#### WebRTC Loopback Bridge (`utils/webrtcLoopbackBridge.ts`)

```typescript
constructor() {
  // Skip native module initialization in Expo Go
  if (isExpoGo) {
    console.log('[WebRtcLoopbackBridge] Running in Expo Go - native module disabled');
    this.nativeModule = null;
    return;
  }
  
  this.nativeModule = (NativeModules as any).WebRtcLoopback || null;
  // ... rest of initialization
}
```

**Behavior:**
- In Expo Go: Module initializes without native support, shows clear error messages
- In dev builds: Full native functionality available

#### Native Media Bridge (`utils/nativeMediaBridge.ts`)

Already has optimal lazy loading with react-native-webrtc:

```typescript
let webrtcModule: WebRTCModule | null | undefined = undefined;

const getWebRTCModule = (): WebRTCModule | null => {
  if (webrtcModule !== undefined) {
    return webrtcModule;
  }
  try {
    webrtcModule = require('react-native-webrtc');
  } catch {
    webrtcModule = null;
  }
  return webrtcModule;
};
```

**Behavior:**
- Attempts to load react-native-webrtc dynamically
- Gracefully falls back if not available
- Works in Expo Go with reduced functionality

#### Native WebRTC Bridge (`utils/nativeWebRTCBridge.ts`)

Similar pattern with dynamic loading:

```typescript
private getWebRTCModule() {
  if (Platform.OS === 'web') return null;
  if (this.webrtcModule !== undefined) {
    return this.webrtcModule;
  }
  try {
    this.webrtcModule = require('react-native-webrtc');
  } catch (e) {
    this.webrtcModule = null;
  }
  return this.webrtcModule;
}
```

**Behavior:**
- Platform-aware module loading
- Null return for incompatible platforms
- Graceful error handling

#### VirtualCamera Module (`modules/virtual-camera/src/VirtualCameraModule.ts`)

Complete mock implementation for Expo Go:

```typescript
try {
  if (isExpoGo) {
    throw new Error('Not available in Expo Go');
  }
  VirtualCameraModule = requireNativeModule('VirtualCamera');
} catch (error) {
  const reason = isExpoGo ? 'Running in Expo Go' : 'Native module not built';
  console.warn(`[VirtualCamera] ${reason}, using mock implementation`);
  
  VirtualCameraModule = {
    async getState() {
      return {
        status: 'disabled',
        error: 'VirtualCamera not available in Expo Go - use standard protocols',
        // ... other fields
      };
    },
    // ... mock methods
  };
}
```

**Behavior:**
- Provides full mock API in Expo Go
- Clear error messages guide users to alternatives
- No crashes or runtime errors

#### Native Media Bridge Module (`modules/native-media-bridge/src/index.ts`)

Simple graceful export:

```typescript
let NativeMediaBridgeModule;

try {
  if (isExpoGo) {
    throw new Error('Not available in Expo Go');
  }
  NativeMediaBridgeModule = requireNativeModule('NativeMediaBridge');
} catch (error) {
  console.warn('[NativeMediaBridge] Not available - graceful fallback enabled');
  NativeMediaBridgeModule = null;
}

export default NativeMediaBridgeModule;
```

**Behavior:**
- Returns null in Expo Go
- Consumers handle null gracefully
- No import crashes

### 3. Protocol Context Updates (`contexts/ProtocolContext.tsx`)

Default settings adjusted for Expo Go:

```typescript
const isExpoGo = Constants.appOwnership === 'expo';

const DEFAULT_WEBRTC_LOOPBACK_SETTINGS: WebRtcLoopbackProtocolSettings = {
  enabled: !isExpoGo,  // Disabled by default in Expo Go
  autoStart: true,
  requireNativeBridge: !isExpoGo,  // No native bridge in Expo Go
  // ... other settings
};

const DEFAULT_PROTOCOLS: Record<ProtocolType, ProtocolConfig> = {
  // ... other protocols
  'webrtc-loopback': {
    id: 'webrtc-loopback',
    name: 'Protocol 6: WebRTC Loopback (iOS)',
    description: 'iOS-only loopback that relies on a native WebRTC bridge for a fake camera track.',
    enabled: !isExpoGo,  // Disabled in Expo Go
    settings: {},
  },
};

// Enterprise WebKit also disabled in Expo Go
const [enterpriseWebKitEnabled, setEnterpriseWebKitEnabledState] = useState(!isExpoGo);
```

**Behavior:**
- Native-dependent features disabled by default in Expo Go
- Users can still enable them (they'll get clear error messages)
- Optimal defaults for each environment

### 4. Advanced Protocol 2 Engine (`utils/advancedProtocol/AdvancedProtocol2Engine.ts`)

Config adjustments for Expo Go:

```typescript
constructor(config: Partial<AdvancedProtocol2Config> = {}) {
  // Apply Expo Go compatibility adjustments to config
  const expoGoAdjustedConfig = isExpoGo ? {
    ...config,
    webrtc: { 
      ...config.webrtc, 
      enabled: false,  // Disable native WebRTC in Expo Go
    },
    crossDevice: {
      ...config.crossDevice,
      enabled: false,  // Disable native cross-device in Expo Go
    },
  } : config;

  this.config = this.mergeConfig(DEFAULT_ADVANCED_PROTOCOL2_CONFIG, expoGoAdjustedConfig);
  // ... rest of constructor
}
```

**Behavior:**
- Automatically disables native-dependent subsystems in Expo Go
- WebView-based features remain functional
- GPU processing, ASI, and crypto validation still work

### 5. App Configuration (`app.json`)

Platform and plugin adjustments:

**Removed from Expo Go:**
- iOS-only platform restriction
- Enterprise WebKit configuration
- `expo-dev-client` plugin (use standard Expo Go)
- Custom WebKit plugin

**Added for Expo Go:**
- Android platform support
- Android permissions
- `recordAudioAndroid: true` for expo-camera

**Behavior:**
- App now works on both iOS and Android in Expo Go
- Custom native features only in dev builds
- Standard Expo modules fully supported

## Protocol-by-Protocol Compatibility

### Protocol 1: Standard Injection
**Status:** ✅ Fully Compatible

**Features:**
- Pure WebView JavaScript injection
- No native dependencies
- Canvas-based video generation
- getUserMedia override

**Expo Go Behavior:**
- Works identically to dev builds
- Full feature parity

### Protocol 2: Advanced Relay (Allowlist Protocol)
**Status:** ✅ Fully Compatible

**Features:**
- Video source pipeline (WebView)
- GPU processing (WebGL in WebView)
- Adaptive Stream Intelligence
- Cryptographic validation

**Expo Go Behavior:**
- WebRTC relay disabled automatically
- Cross-device streaming disabled
- All WebView-based features work
- GPU processing uses WebGL (browser)

### Protocol 3: Protected Preview
**Status:** ✅ Fully Compatible

**Features:**
- Body detection (ML in WebView)
- Video replacement
- Blur fallback
- Local preview

**Expo Go Behavior:**
- Works identically to dev builds
- All features available
- Uses browser-based ML models

### Protocol 4: Local Test Harness
**Status:** ✅ Fully Compatible

**Features:**
- Local test environment
- Debug overlay
- Frame capture
- Audio passthrough

**Expo Go Behavior:**
- Works identically to dev builds
- Full feature parity

### Protocol 5: Holographic Stream Injection
**Status:** ✅ Fully Compatible

**Features:**
- WebSocket bridge (postMessage)
- SDP masquerade
- Canvas synthesis
- Device emulation

**Expo Go Behavior:**
- Works identically to dev builds
- Uses React Native postMessage (not real WebSockets)
- Full feature parity

### Protocol 6: WebSocket Bridge
**Status:** ✅ Fully Compatible

**Features:**
- Frame streaming via postMessage
- React Native to WebView bridge
- Canvas rendering
- MediaStream capture

**Expo Go Behavior:**
- Works identically to dev builds
- No native dependencies
- Full feature parity

### Protocol 6: WebRTC Loopback
**Status:** ⚠️ Limited (Graceful Fallback)

**Features:**
- Native WebRTC peer connection
- Video file playback as camera
- Ring buffer recording
- Stats collection

**Expo Go Behavior:**
- Disabled by default (`enabled: false`)
- Clear error messages if user tries to enable
- Suggests using other protocols or dev build
- No crashes or undefined behavior

**Error Message:**
```
"WebRTC loopback is not available in Expo Go. 
Please use a development build or other protocols."
```

## Testing in Expo Go

### Prerequisites

1. Install Expo Go app on your device/simulator
2. Ensure app.json is configured correctly (already done)
3. Start development server: `npm start`

### Testing Protocol Compatibility

#### Test Script

```bash
# Start development server
npm start

# Scan QR code with Expo Go app
# OR press 'i' for iOS simulator
# OR press 'a' for Android emulator
```

#### Manual Testing Checklist

**Standard Features (All Protocols 1-6 except WebRTC Loopback):**
- [ ] App launches without errors
- [ ] Can select videos from library
- [ ] Can open browser with injection
- [ ] getUserMedia is successfully intercepted
- [ ] Video plays in WebView
- [ ] Protocol switching works
- [ ] No native module errors in logs

**WebRTC Loopback (Expected Limited Behavior):**
- [ ] Protocol is disabled by default
- [ ] Enabling shows clear error message
- [ ] App doesn't crash when error shown
- [ ] User can switch to other protocols

**General Stability:**
- [ ] No red screen errors
- [ ] Console shows Expo Go detection logs
- [ ] All UI elements render correctly
- [ ] Navigation works smoothly

### Expected Log Output

```
[AdvancedProtocol2] Running in Expo Go - native features disabled
[WebRtcLoopbackBridge] Running in Expo Go - native module disabled
[VirtualCamera] Running in Expo Go, using mock implementation
[NativeMediaBridge] Not available - graceful fallback enabled
[Protocol0] ===== ULTRA-EARLY DEEP HOOK =====
[Protocol0] Devices configured: 2
[Protocol0] Video URI: data:video/mp4;base64,...
[Protocol0] ===== INJECTION COMPLETE =====
```

## Developer Guidelines

### Adding New Native Modules

When adding new native module dependencies:

1. **Add Expo Go Detection:**
```typescript
import Constants from 'expo-constants';

const isExpoGo = Constants.appOwnership === 'expo';
```

2. **Conditional Module Loading:**
```typescript
let MyNativeModule;

try {
  if (isExpoGo) {
    throw new Error('Not available in Expo Go');
  }
  MyNativeModule = requireNativeModule('MyModule');
} catch (error) {
  console.warn('[MyModule] Not available - using fallback');
  MyNativeModule = null;
}
```

3. **Provide Mock/Fallback:**
```typescript
if (!MyNativeModule) {
  MyNativeModule = {
    async myMethod() {
      throw new Error('Not available in Expo Go. Use a development build.');
    },
  };
}
```

4. **Update Default Configs:**
```typescript
const DEFAULT_CONFIG = {
  enabled: !isExpoGo,
  requireNative: !isExpoGo,
  // ... other settings
};
```

### Best Practices

**DO:**
- ✅ Use `Constants.appOwnership === 'expo'` for detection
- ✅ Provide clear, actionable error messages
- ✅ Log Expo Go status in constructors
- ✅ Disable native-dependent features by default in Expo Go
- ✅ Provide WebView-based alternatives where possible
- ✅ Test in both Expo Go and dev builds

**DON'T:**
- ❌ Crash when native modules aren't available
- ❌ Throw errors during module initialization
- ❌ Use `__DEV__` for Expo Go detection
- ❌ Assume native modules are always available
- ❌ Block app functionality entirely when native features missing

## Troubleshooting

### Issue: "NativeModule 'X' not found"

**Cause:** Module not included in Expo Go

**Solution:**
1. Check if module has Expo Go detection
2. Ensure graceful fallback is in place
3. Verify module is only required conditionally

### Issue: "Cannot read property 'method' of null"

**Cause:** Native module is null but code doesn't handle it

**Solution:**
1. Add null check before calling methods
2. Provide mock implementation
3. Update calling code to handle null gracefully

### Issue: Protocol doesn't work in Expo Go

**Cause:** Protocol depends on native features

**Solution:**
1. Check if protocol is in "Limited Compatibility" list
2. Verify protocol is disabled by default in Expo Go
3. Ensure error messages are clear
4. Consider creating WebView-based alternative

### Issue: App crashes in Expo Go but works in dev build

**Cause:** Native module loaded at top level

**Solution:**
1. Move require() into try-catch
2. Add Expo Go detection before require
3. Lazy load the module when first needed

## Migration from Dev Build to Expo Go

If you're testing features that previously required a dev build:

### 1. Update Dependencies

No changes needed! All standard Expo modules work in both.

### 2. Test Native Features

Features that require custom native modules will:
- Show clear error messages
- Suggest alternatives
- Not crash the app

### 3. Alternative Approaches

For features not available in Expo Go:

**Instead of:** Custom native camera module
**Use:** expo-camera or Protocol 1-5

**Instead of:** Custom native WebRTC
**Use:** Browser WebRTC (Protocol 2-5)

**Instead of:** Custom native video processing
**Use:** WebGL in WebView (Protocol 2)

## Performance Considerations

### Expo Go vs Dev Build Performance

**Protocols 1-6 (except WebRTC Loopback):**
- Similar performance in both environments
- WebView rendering is identical
- JavaScript execution speed comparable

**WebRTC Loopback:**
- Not available in Expo Go (disabled)
- Native implementation in dev build is more efficient

### Optimization Tips

1. **Use Protocol 2 (Advanced Relay)** for best Expo Go performance
2. **Enable GPU processing** for smooth video rendering
3. **Disable unnecessary features** in Expo Go
4. **Preload videos** for faster injection
5. **Use appropriate resolution** for target device

## Future Improvements

### Planned Enhancements

1. **WebAssembly WebRTC**
   - Pure JavaScript WebRTC implementation
   - Would enable WebRTC Loopback in Expo Go
   - Currently in research phase

2. **Browser-based Video Processing**
   - Move more features to WebView
   - Reduce native dependencies
   - Improve Expo Go feature parity

3. **Progressive Enhancement**
   - Detect capabilities at runtime
   - Automatically select best available protocol
   - Seamless experience across environments

## Conclusion

The codebase is now **fully optimized for Expo Go** with:

- ✅ All core protocols working in Expo Go
- ✅ Graceful fallbacks for native-dependent features
- ✅ Clear error messages and logging
- ✅ No crashes or undefined behavior
- ✅ Comprehensive documentation
- ✅ Easy testing and debugging

**Recommended Workflow:**
1. Develop and test in Expo Go for fast iteration
2. Test native-dependent features in dev build
3. Build standalone apps for production

**Key Takeaway:** The app provides a great experience in both Expo Go and dev builds, with automatic adaptation to available capabilities.

---

**Last Updated:** 2026-02-03
**Version:** 1.0.0
**Compatibility:** Expo SDK 54+
