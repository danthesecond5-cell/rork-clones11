# Expo Go Compatibility Report (Protocols)

This document audits **each protocol** in this repo for **Expo Go** compatibility (i.e., running inside the Expo Go client where **custom native modules are unavailable**).

## Key constraint (Expo Go)

- Expo Go cannot load arbitrary native modules (anything that requires custom iOS/Android native code).
- JavaScript-only solutions and **Expo SDK** modules are OK.
- A dependency can exist in `package.json`, but **any top-level import that touches native code can crash**. For Expo Go, native dependencies must be **lazy-required** and guarded behind runtime checks.

## Environment detection used

- `utils/expoEnv.ts` implements `isExpoGo()` using `expo-constants`:
  - Preferred: `Constants.executionEnvironment === 'storeClient'`
  - Fallback: `Constants.appOwnership === 'expo'`

## Protocol-by-protocol analysis

### Protocol 1: `standard`

- **Primary mechanism**: WebView-side `getUserMedia` interception + canvas/video synthesis (Protocol 0 script).
- **Expo Go compatibility**: **Compatible**.
- **Notes**:
  - Works within the constraints of iOS WKWebView feature support (e.g. `captureStream` availability varies).
  - For very large injection scripts, the app now avoids the native “working injection” fallback when running in Expo Go.

### Protocol 2: `allowlist` (Advanced Relay)

- **Primary mechanism**: WebView injection with additional “advanced relay” behaviors (ASI/GPU/crypto flags) implemented in JS.
- **Expo Go compatibility**: **Compatible (with WebView feature limits)**.
- **Potential limitations in Expo Go**:
  - Any “GPU/WebCodecs” style acceleration depends on what the embedded WebView supports; in iOS WKWebView, WebCodecs is typically unavailable unless using special/private frameworks.
  - WebRTC-in-WebView is generally available, but deeper native integration is not.

### Protocol 3: `protected` (Protected Preview)

- **Primary mechanism**: App-side preview/controls + conservative injection behavior.
- **Expo Go compatibility**: **Compatible**.
- **Notes**:
  - Uses Expo SDK modules where needed (camera, media library, etc.) and does not require custom native modules.

### Protocol 4: `harness` (Local Test Harness)

- **Primary mechanism**: Local sandbox page + overlay testing without third-party sites.
- **Expo Go compatibility**: **Compatible**.

### Protocol 5: `holographic` (Holographic Stream Injection)

- **Primary mechanism**: WebView injection + optional bridge behaviors (network/WebSocket APIs in WebView).
- **Expo Go compatibility**: **Compatible (network-dependent)**.
- **Notes**:
  - This protocol can require network reachability depending on configuration.
  - No custom native modules are required by default in the app layer.

### Protocol 6: `websocket` (WebSocket Bridge)

- **Primary mechanism**: WebView injection that relies on `window.ReactNativeWebView.postMessage` for frame/control transport (not a real OS-level websocket server).
- **Expo Go compatibility**: **Compatible**.
- **Notes**:
  - This is the most reliable Expo Go-safe approach because it stays entirely in JS + the WebView bridge.

### Protocol 6 (alt): `webrtc-loopback` (Native iOS loopback)

- **Primary mechanism**: A **native** loopback module (`NativeModules.WebRtcLoopback`) and related native-side WebRTC pipeline.
- **Expo Go compatibility**: **NOT compatible** (requires custom native module).
- **Mitigation implemented**:
  - The protocol is **forced disabled** in Expo Go at the settings/state layer.
  - UI prevents selecting it as active when in Expo Go.

## Native bridges audit (non-protocol-specific)

### Native WebRTC bridge (`constants/nativeWebRTCBridge.ts` + `utils/nativeWebRTCBridge.ts`)

- **Requires**: `react-native-webrtc` native module (not present in Expo Go).
- **Expo Go mitigation implemented**:
  - `app/index.tsx` disables native bridge injection when `isExpoGo()` is true.

### Native Media Bridge (`modules/native-media-bridge` + `utils/nativeMediaBridge.ts`)

- **Requires**: custom Expo module `NativeMediaBridge` (not present in Expo Go).
- **Expo Go mitigation implemented**:
  - `utils/nativeMediaBridge.ts` no longer statically imports `react-native-webrtc`; it **lazy-requires** it only when needed.
  - The app avoids choosing the “working injection” script fallback (which uses `nativeGumOffer`) when in Expo Go.

## Summary table

| Protocol ID | Expo Go compatible | Reason |
|---|---:|---|
| `standard` | Yes | JS/WebView injection |
| `allowlist` | Yes* | JS/WebView injection (*subject to WebView features) |
| `protected` | Yes | Expo SDK + JS |
| `harness` | Yes | Local JS/WebView |
| `holographic` | Yes* | JS/WebView + network (*config-dependent) |
| `websocket` | Yes | JS + `ReactNativeWebView` bridge |
| `webrtc-loopback` | No | Custom native module required |

