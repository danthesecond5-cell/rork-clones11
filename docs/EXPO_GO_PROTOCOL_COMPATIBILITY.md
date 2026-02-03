# Expo Go Protocol Compatibility Report

Date: 2026-02-03

## Scope
This report evaluates each protocol and its Expo Go compatibility, then documents
the runtime guards and defaults implemented to keep Expo Go builds stable.

## Runtime detection
Expo Go is detected using `expo-constants`:
- `Constants.appOwnership === 'expo'`, or
- `Constants.executionEnvironment === 'storeClient'`

This is used to enforce safe defaults and disable unsupported protocols.

## Protocol compatibility matrix

| Protocol | Expo Go compatibility | Key dependencies | Status |
| --- | --- | --- | --- |
| Protocol 1: Standard Injection | Partial | WebView + canvas captureStream or frame generator | Works when captureStream or MediaStreamTrackGenerator is available; otherwise limited. |
| Protocol 2: Advanced Relay (Allowlist) | Partial | Same as Standard + optional WebRTC/GPU/ASI/Crypto | Advanced features disabled in Expo Go; falls back to Standard injection. |
| Protocol 3: Protected Preview | Partial | Same as Standard + local preview | Depends on Standard injection capabilities. |
| Protocol 4: Local Test Harness | Partial | Same as Standard | Depends on Standard injection capabilities. |
| Protocol 5: Holographic Stream Injection | Not supported | WebRTC + captureStream + SDP mutation | Disabled in Expo Go. Requires native build. |
| Protocol 6: WebSocket Bridge | Supported | WebView postMessage bridge | Default protocol for Expo Go; tuned for lower resource usage. |
| Protocol 6: WebRTC Loopback (iOS) | Not supported | Native WebRTC loopback module | Disabled in Expo Go. Requires native build. |

## Protocol deep dive

### Protocol 1: Standard Injection
- **Mechanism:** JavaScript injection into WebView, overrides `getUserMedia`, creates
  a synthetic MediaStream from a canvas or frame generator.
- **Expo Go compatibility:** **Partial**.
  - Works if `canvas.captureStream` or `MediaStreamTrackGenerator` is supported by
    the WebView runtime.
  - If neither is available, the JS-only injector cannot produce a MediaStream.
- **Expo Go changes:** Kept enabled but not the default protocol. Native bridging
  is disabled in Expo Go to avoid forcing unavailable native modules.

### Protocol 2: Advanced Relay (Allowlist)
- **Mechanism:** Domain filtering + advanced relay features (WebRTC, GPU, ASI,
  cross-device streaming, crypto validation).
- **Expo Go compatibility:** **Partial**.
  - Allowlist itself works (domain filter + fallback injection).
  - Advanced relay features require WebRTC and/or native support.
- **Expo Go changes:** Advanced relay sub-features are forcibly disabled in Expo Go
  (WebRTC, GPU, ASI, cross-device, crypto). The protocol falls back to Standard
  injection behavior for compatibility.

### Protocol 3: Protected Preview
- **Mechanism:** Local preview with replacement video or blur fallback.
- **Expo Go compatibility:** **Partial**.
  - Shares the same injection path as Standard injection.
- **Expo Go changes:** None beyond Standard injection and default protocol changes.

### Protocol 4: Local Test Harness
- **Mechanism:** Local sandbox page with overlay injection.
- **Expo Go compatibility:** **Partial**.
  - Depends on Standard injection capabilities.
- **Expo Go changes:** None beyond Standard injection and default protocol changes.

### Protocol 5: Holographic Stream Injection
- **Mechanism:** WebSocket bridge + SDP mutation + canvas synthesis.
- **Expo Go compatibility:** **Not supported**.
  - Requires WebRTC/captureStream capabilities typically unavailable in Expo Go.
- **Expo Go changes:** Protocol disabled and marked as unavailable.

### Protocol 6: WebSocket Bridge
- **Mechanism:** React Native postMessage bridge for frame streaming into WebView.
- **Expo Go compatibility:** **Supported**.
  - Does not require custom native modules.
- **Expo Go changes:** Default protocol for Expo Go, with lower default resolution
  and quality to reduce CPU/memory usage.

### Protocol 6: WebRTC Loopback (iOS)
- **Mechanism:** Native iOS loopback module providing a fake camera track.
- **Expo Go compatibility:** **Not supported**.
  - Requires custom native module (`WebRtcLoopback`) and `react-native-webrtc`.
- **Expo Go changes:** Protocol disabled and marked as unavailable.

## Native bridge dependencies
These components require custom native modules and are not available in Expo Go:
- `react-native-webrtc`
- `NativeMediaBridge`
- `WebRtcLoopback`

Expo Go changes include lazy loading `react-native-webrtc` and disabling native
bridging at runtime when running in Expo Go.

## Expo Go optimizations implemented
- **Default protocol** set to **WebSocket Bridge** when in Expo Go.
- **Advanced relay sub-features** disabled in Expo Go (WebRTC/GPU/ASI/Crypto).
- **Holographic + WebRTC loopback** protocols disabled in Expo Go.
- **Enterprise WebKit flags** forced off in Expo Go.
- **Native WebRTC bridge** disabled in Expo Go to avoid unavailable native modules.
- **WebSocket Bridge defaults** tuned for Expo Go (720p, 24fps, lower quality).
- **Lazy import** of `react-native-webrtc` to avoid Expo Go crashes.

## Remaining limitations and risks
- **WKWebView captureStream availability:** Many iOS WebView environments do not
  expose `canvas.captureStream`. When missing, JS-only protocols cannot create
  synthetic MediaStreams.
- **MediaStreamTrackGenerator availability:** If unsupported, the injector falls
  back to captureStream only.
- **Site-specific behavior:** Some sites may still block injection even when the
  protocol is compatible. The WebSocket Bridge is the most stable option in Expo Go.

## Recommended Expo Go testing checklist
- Verify WebSocket Bridge injection on common sites (webcamtests.com, etc.).
- Confirm Standard/Allowlist protocols fall back gracefully.
- Ensure disabled protocols remain unavailable in Expo Go UI.
- Validate that no `react-native-webrtc` native module calls occur in Expo Go.
