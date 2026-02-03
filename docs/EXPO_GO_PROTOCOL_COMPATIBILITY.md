# Expo Go Protocol Compatibility Report

## Environment detection
- Expo Go is detected via `Constants.appOwnership === 'expo'` (see `utils/expoRuntime.ts`).
- Expo Go does not load custom native modules (e.g., `NativeMediaBridge`, `WebRtcLoopback`, `VirtualCamera`).

## Protocol compatibility matrix

| Protocol | Expo Go support | Key dependencies | Notes |
| --- | --- | --- | --- |
| Protocol 1: Standard Injection | YES (with limits) | WebView JS injection, canvas/captureStream | Works in Expo Go. If WebView lacks `captureStream`/WebCodecs, injection may fall back to real getUserMedia or show unsupported notice. |
| Protocol 2: Advanced Relay (Allowlist) | YES (with limits) | WebView JS, optional WebRTC in WebView | WebRTC relay runs inside the WebView. Requires WebView WebRTC support. No native RN modules. |
| Protocol 3: Protected Preview | YES | WebView JS injection | Uses the same JS injection flow; no native modules. |
| Protocol 4: Local Test Harness | YES | WebView JS injection | Local-only harness; no native modules. |
| Protocol 5: Holographic | YES (with limits) | WebSocket, canvas/WebGL | Depends on WebSocket availability and WebGL/canvas performance in WebView. |
| Protocol 6: WebSocket Bridge | YES | React Native <-> WebView messaging | Most reliable Expo Go option; no native modules required. |
| Protocol 6: WebRTC Loopback (iOS) | NO | Native WebRtcLoopback + react-native-webrtc | Disabled in Expo Go. Requires custom native build (dev client/EAS). |

## Native features and bridges

### Enterprise WebKit flags
- **Status:** Not available in Expo Go.
- **Reason:** Requires custom WebKit framework injection and Info.plist flags.
- **Handling:** Disabled and guarded in UI and protocol defaults.

### Native WebRTC bridge (WebView getUserMedia override)
- **Status:** Not available in Expo Go.
- **Reason:** Requires `react-native-webrtc` native module.
- **Handling:** Disabled in Expo Go to avoid injecting the native bridge script.

### Native media bridge fallback (iOS-only)
- **Status:** Not available in Expo Go.
- **Reason:** Depends on `NativeMediaBridge` native module or `react-native-webrtc`.
- **Handling:** Expo Go short-circuits native bridge requests with an explicit error.

### WebRTC loopback native module
- **Status:** Not available in Expo Go.
- **Reason:** Depends on `WebRtcLoopback` native module.
- **Handling:** Protocol disabled by default; settings and activation are guarded.

### Virtual Camera module
- **Status:** Not available in Expo Go.
- **Reason:** Custom native module.
- **Handling:** JS layer uses a mock fallback that logs warnings instead of crashing.

## Per-protocol notes and risks

### Standard Injection
- Uses JS-only injection and can fall back to real getUserMedia when not in stealth mode.
- On iOS Expo Go, WebView limitations (missing `captureStream`/WebCodecs) may reduce stealth or require fallback.

### Advanced Relay (Allowlist)
- Advanced features (WebRTC relay, GPU, ASI, Crypto) are JS-only and run in the WebView.
- If WebView WebRTC is limited, the relay path will degrade but should not crash the app.

### Protected Preview
- Uses JS overlays and detection logic. No native dependencies.

### Local Test Harness
- Pure WebView injection; safe for Expo Go diagnostics.

### Holographic
- Depends on WebSocket connectivity and canvas/WebGL performance.
- WebGL is generally available in WebView, but low-end devices may struggle.

### WebSocket Bridge
- Relies on RN <-> WebView messaging. This is the most Expo Go-friendly path.

### WebRTC Loopback
- Requires native iOS module and WebRTC provider. Not compatible with Expo Go.
- Use a custom dev client or EAS build to enable.

## Recommended Expo Go defaults
- Prefer **Protocol 6: WebSocket Bridge** for maximum compatibility.
- Use **Standard Injection** or **Protected Preview** when WebView capabilities are sufficient.
- Avoid **WebRTC Loopback** and **Enterprise WebKit** features in Expo Go.
