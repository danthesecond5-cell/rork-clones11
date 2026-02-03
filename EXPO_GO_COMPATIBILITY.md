# Expo Go Compatibility Analysis

This document provides a comprehensive analysis of every protocol's compatibility with Expo Go and the optimizations made to ensure maximum compatibility.

## Overview

Expo Go is a convenient way to test React Native applications without needing to build a native app. However, it comes with limitations:

- **No custom native modules**: Packages like `react-native-webrtc` won't work
- **Limited native code access**: Native modules in `modules/` and `packages/` directories are not available
- **Expo SDK only**: Only packages included in the Expo SDK or JavaScript-only packages work

This codebase has been optimized to automatically detect Expo Go and adjust behavior accordingly.

---

## Protocol Compatibility Matrix

| Protocol | Expo Go Compatible | Notes |
|----------|-------------------|-------|
| Protocol 1: Standard Injection | ✅ YES | Browser-side getUserMedia interception |
| Protocol 2: Advanced Relay | ⚠️ PARTIAL | Browser-side features work; WebRTC relay disabled |
| Protocol 3: Protected Preview | ✅ YES | Browser-side body detection |
| Protocol 4: Test Harness | ✅ YES | Browser-side sandbox |
| Protocol 5: Holographic Stream | ✅ YES | WebSocket/PostMessage bridge |
| Protocol 6: WebSocket Bridge | ✅ YES (RECOMMENDED) | PostMessage frame streaming |
| Protocol 7: WebRTC Loopback | ❌ NO | Requires native WebRTC module |

---

## Detailed Protocol Analysis

### Protocol 1: Standard Injection (Standard)
**Expo Go Compatible: YES**

**How it works:**
- Injects JavaScript into WebView to intercept `navigator.mediaDevices.getUserMedia`
- Replaces camera stream with canvas-based video feed
- All processing happens in the WebView JavaScript context

**Expo Go behavior:**
- Works exactly the same in Expo Go
- No native modules required
- Full functionality available

---

### Protocol 2: Advanced Relay (Allowlist)
**Expo Go Compatible: PARTIAL**

**Components:**
| Component | Expo Go | Notes |
|-----------|---------|-------|
| Video Pipeline | ✅ | Browser-side frame processing |
| GPU Processing | ✅ | WebGL shader-based effects |
| ASI (Adaptive Stream Intelligence) | ✅ | Browser-side site analysis |
| WebRTC Relay | ❌ | Requires native WebRTC |
| Cross-Device Streaming | ❌ | Requires native networking (mDNS) |
| Crypto Validation | ✅ | Uses expo-crypto |

**Expo Go behavior:**
- WebRTC relay components automatically disabled
- Cross-device streaming disabled
- GPU processing and ASI continue to work
- Recommendation: Use Protocol 6 for full injection capability

**Configuration changes in Expo Go:**
```typescript
advancedRelay: {
  webrtc: { enabled: false },
  crossDevice: { enabled: false },
  // GPU, ASI, Crypto still enabled
}
```

---

### Protocol 3: Protected Preview
**Expo Go Compatible: YES**

**How it works:**
- Browser-side ML body detection
- Automatically swaps to safe video when sensitive content detected
- All processing in WebView JavaScript

**Expo Go behavior:**
- Works exactly the same in Expo Go
- No native modules required
- Full functionality available

---

### Protocol 4: Test Harness
**Expo Go Compatible: YES**

**How it works:**
- Local sandbox page loaded in WebView
- Safe environment for testing injection
- No third-party site interaction

**Expo Go behavior:**
- Works exactly the same in Expo Go
- Ideal for development and testing
- No native modules required

---

### Protocol 5: Holographic Stream Injection
**Expo Go Compatible: YES**

**How it works:**
- WebSocket/PostMessage bridge between React Native and WebView
- Canvas-based stream synthesis
- SDP mutation for stealth

**Expo Go behavior:**
- Works exactly the same in Expo Go
- Uses PostMessage which is always available
- Good alternative to WebRTC-based methods

---

### Protocol 6: WebSocket Bridge (RECOMMENDED)
**Expo Go Compatible: YES**

**How it works:**
- Streams video frames via React Native's postMessage bridge
- WebView reconstructs frames into MediaStream
- Bypasses all canvas timing issues
- Maximum reliability and compatibility

**Expo Go behavior:**
- Works exactly the same in Expo Go
- **RECOMMENDED for Expo Go users**
- Most reliable injection method
- No native modules required

**Why it's the best choice for Expo Go:**
1. No native dependencies
2. Uses only standard React Native WebView features
3. Reliable frame delivery
4. Works on both iOS and Android
5. No canvas timing issues

---

### Protocol 7: WebRTC Loopback (Native Only)
**Expo Go Compatible: NO**

**How it works:**
- Native iOS module creates WebRTC peer connection
- Injects video track at native level
- Most powerful injection method for iOS

**Expo Go behavior:**
- Automatically disabled in Expo Go
- Error messages guide users to use Protocol 6 instead
- Requires development build with EAS Build for full functionality

**To enable:**
1. Run `npx expo prebuild`
2. Build with EAS: `eas build`
3. Install development build on device

---

## File-by-File Changes

### `/contexts/ProtocolContext.tsx`
- Added `isExpoGo` detection using `Constants.appOwnership`
- WebRTC-dependent settings disabled in Expo Go
- Protocol descriptions updated with Expo Go compatibility notes
- WebRTC Loopback protocol disabled by default in Expo Go

### `/utils/nativeMediaBridge.ts`
- Added Expo Go detection
- WebRTC module loading skipped in Expo Go
- Native bridge loading skipped in Expo Go
- Added `isNativeWebRTCAvailable()` helper function
- Error messages guide users to Protocol 6

### `/utils/nativeWebRTCBridge.ts`
- Added Expo Go detection
- Bridge disabled in Expo Go
- Added `isNativeWebRTCAvailable()` method
- Helpful error messages for Expo Go users

### `/utils/webrtcLoopbackBridge.ts`
- Added Expo Go detection
- Native module loading skipped in Expo Go
- Added `isNativeLoopbackAvailable()` method
- Added `isRunningInExpoGo()` method
- Improved error handling for Expo Go

### `/types/protocols.ts`
- Updated `DEFAULT_WEBRTC_LOOPBACK_SETTINGS` for Expo Go
- `enabled: false` by default
- `requireNativeBridge: false` by default
- Updated `PROTOCOL_METADATA` with Expo Go compatibility notes

---

## Detection Mechanism

The codebase uses `expo-constants` to detect Expo Go:

```typescript
import Constants from 'expo-constants';

const isExpoGo = Constants.appOwnership === 'expo';
```

This returns:
- `'expo'` - Running in Expo Go
- `'standalone'` - Production app
- `'guest'` - Running as guest in another app
- `undefined` - Unknown/bare workflow

---

## Recommendations for Developers

### For Development (Expo Go):
1. Use **Protocol 6: WebSocket Bridge** for video injection
2. Use **Protocol 4: Test Harness** for safe testing
3. Avoid enabling WebRTC Loopback settings

### For Production (Development Build):
1. Run `npx expo prebuild` to generate native projects
2. Build with EAS: `eas build --platform ios` (or android)
3. Enable WebRTC Loopback for iOS for best performance
4. Enable cross-device streaming features

### For Testing:
1. Test core injection with Protocol 1 or Protocol 6
2. Use Protocol 4 (Test Harness) for sandboxed testing
3. Test on real devices for accurate WebView behavior

---

## Error Messages

When native features are used in Expo Go, helpful error messages are shown:

**Native WebRTC Bridge:**
```
Native WebRTC is not available in Expo Go. Please use Protocol 6 (WebSocket Bridge) 
for video injection, or create a development build with EAS Build for native WebRTC support.
```

**WebRTC Loopback:**
```
Native WebRTC loopback is not available in Expo Go. Please use Protocol 6 (WebSocket Bridge) 
for video injection, or create a development build with EAS Build for native WebRTC support.
```

---

## Testing Expo Go Compatibility

To verify Expo Go compatibility:

1. Start the app with Expo Go:
   ```bash
   npx expo start
   ```

2. Scan QR code with Expo Go app

3. Verify:
   - App launches without native module errors
   - Protocol 6 works for video injection
   - Native-dependent features show helpful warnings (not crashes)
   - Console logs show "Running in Expo Go: true"

---

## Summary

| Feature | Expo Go | Development Build |
|---------|---------|-------------------|
| Protocol 1-5 | ✅ Full | ✅ Full |
| Protocol 6 (WebSocket) | ✅ Full (Recommended) | ✅ Full |
| Protocol 7 (Native WebRTC) | ❌ Disabled | ✅ Full |
| Cross-device streaming | ❌ Disabled | ✅ Full |
| Native video capture | ❌ Not available | ✅ Available |
| Recording features | ❌ Limited | ✅ Full |

**Bottom line:** For Expo Go development, use **Protocol 6: WebSocket Bridge** for the best experience. For production or advanced features, create a development build.
