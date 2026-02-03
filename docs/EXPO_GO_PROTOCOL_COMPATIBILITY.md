# Expo Go Protocol Compatibility Analysis

**Date:** 2026-02-03  
**Scope:** Standard, Allowlist (Advanced Relay), Protected, Harness, Holographic, WebSocket, WebRTC Loopback  
**Target Runtime:** Expo Go (managed client, no custom native modules)

---

## Summary

- All protocol paths that rely on WebView-injected JavaScript are Expo Go compatible.
- Native-only features (WebRTC loopback and native WebRTC bridge) are **not** available in Expo Go and are disabled by default.
- A runtime guard now avoids enabling native WebRTC bridging in Expo Go and auto-falls back from disabled protocols.

---

## Compatibility Matrix

| Protocol | Key Code Paths | Native Dependencies | Expo Go Status | Notes |
| --- | --- | --- | --- | --- |
| Standard Injection | `constants/browserScripts.ts`, `constants/workingInjection.ts` | None | ✅ Compatible | WebView injection only. |
| Allowlist / Advanced Relay | `utils/advancedProtocol/browserScript.ts` | None (WebView APIs only) | ✅ Compatible | Optional WebRTC/WebGL features depend on WebView support. |
| Protected Preview | `constants/browserScripts.ts` | None | ✅ Compatible | Uses standard injection base. |
| Local Harness | `constants/browserScripts.ts` | None | ✅ Compatible | Local test harness. |
| Holographic Stream | `constants/browserScripts.ts` | None | ✅ Compatible | Optional WebSocket bridge; network dependent. |
| WebSocket Bridge | `utils/websocketBridge/*` | None | ✅ Compatible | Requires WS connectivity. |
| WebRTC Loopback (iOS) | `constants/webrtcLoopback.ts`, `utils/webrtcLoopbackBridge.ts` | Custom native module | ❌ Not Compatible | Requires dev client / custom build. |

---

## Protocol-by-Protocol Analysis

### 1) Standard Injection (Protocol 1)
- **Primary code:** `constants/browserScripts.ts` (`createMediaInjectionScript`, `createProtocol0Script`), `constants/workingInjection.ts`.
- **Runtime model:** WebView script injection; no native modules.
- **Expo Go compatibility:** **Fully compatible**. Uses standard WebView JS APIs (canvas/video captureStream).
- **Risks:** Large injection strings can be truncated on some WebViews.
- **Mitigations:** Built-in fallback to `createWorkingInjectionScript` when script size is too large.

### 2) Allowlist / Advanced Relay (Protocol 2)
- **Primary code:** `utils/advancedProtocol/browserScript.ts`, `app/index.tsx`, `contexts/ProtocolContext.tsx`.
- **Runtime model:** WebView-only interception of `getUserMedia` + optional WebRTC relay, WebGL processing, ASI, and crypto logic.
- **Expo Go compatibility:** **Compatible** (WebView JS only).
- **Risks:** Optional features require WebView capabilities:
  - WebRTC Relay requires `RTCPeerConnection` in WebView.
  - GPU processing requires WebGL support.
- **Mitigations:** Features self-disable when missing capabilities; Expo Go defaults now reduce heavy features by default.

### 3) Protected Preview (Protocol 3)
- **Primary code:** `constants/browserScripts.ts` via `createMediaInjectionScript`.
- **Runtime model:** Same injection base as standard; overlay logic in WebView.
- **Expo Go compatibility:** **Fully compatible**.
- **Risks:** None beyond normal WebView constraints.

### 4) Local Test Harness (Protocol 4)
- **Primary code:** `constants/browserScripts.ts`, `app/protocol-tester.tsx`.
- **Runtime model:** Local sandbox page + WebView injection.
- **Expo Go compatibility:** **Fully compatible**.
- **Risks:** None beyond WebView availability in Expo Go.

### 5) Holographic Stream Injection (Protocol 5)
- **Primary code:** `constants/browserScripts.ts`, `utils/websocketBridge/*` (optional).
- **Runtime model:** WebView injection; optional WebSocket bridge for frame delivery.
- **Expo Go compatibility:** **Compatible**.
- **Risks:** WebSocket connectivity and server availability.
- **Mitigations:** Falls back to local injection if WebSocket bridge is not active.

### 6) WebSocket Bridge (Protocol 6)
- **Primary code:** `utils/websocketBridge/WebSocketVideoBridge.ts`, `constants/browserScripts.ts`.
- **Runtime model:** WebView and RN JS bridge using WebSocket.
- **Expo Go compatibility:** **Fully compatible** (no native modules).
- **Risks:** Network latency and WS disconnects.
- **Mitigations:** Bridge retries and graceful degradation paths.

### 7) WebRTC Loopback (iOS)
- **Primary code:** `constants/webrtcLoopback.ts`, `utils/webrtcLoopbackBridge.ts`, `modules/native-media-bridge/*`.
- **Runtime model:** Native module provides WebRTC loopback track to WebView.
- **Expo Go compatibility:** **Not compatible**.
- **Why:** Requires custom native code and `react-native-webrtc`.
- **Mitigations:** Protocol is disabled in Expo Go and auto-falls back to a compatible protocol.

---

## Native WebRTC Bridge (Non-Protocol)

- **Primary code:** `constants/nativeWebRTCBridge.ts`, `utils/nativeWebRTCBridge.ts`, `utils/nativeMediaBridge.ts`.
- **Purpose:** Provide a native WebRTC MediaStream to the WebView in environments with custom native modules.
- **Expo Go compatibility:** **Not compatible** (requires custom native modules).
- **Mitigation in code:** Native bridge injection is disabled when running in Expo Go.

---

## Implementation Notes (Expo Go Optimizations)

- **Expo Go guard:** `utils/expoGo.ts` centralizes detection.
- **Native bridge disabled:** `app/index.tsx` now avoids injecting the native WebRTC bridge in Expo Go.
- **Protocol safety fallback:** `contexts/ProtocolContext.tsx` auto-falls back when a protocol is disabled (e.g., WebRTC loopback).
- **Advanced defaults:** Advanced Relay defaults are reduced in Expo Go to avoid heavy WebRTC/WebGL paths by default.

---

## Recommendations

1. **Expo Go default protocol:** Standard or WebSocket Bridge for maximum reliability.
2. **Advanced Relay:** Enable selectively if the WebView supports WebRTC/WebGL.
3. **WebRTC Loopback:** Use only in custom dev builds (EAS or dev client).
4. **Native WebRTC Bridge:** Keep disabled in Expo Go; enable only in native builds.

---

## Status

✅ All protocol code paths have been reviewed for Expo Go compatibility.  
✅ Expo Go guards and fallbacks are in place for native-only features.  
✅ Each protocol has a documented compatibility assessment above.
