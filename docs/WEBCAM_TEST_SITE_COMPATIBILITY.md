# Webcam Test Site Compatibility

This document describes how each injection protocol works with webcam testing sites like https://webcamtests.com/recorder and similar services.

## Overview

Webcam test sites typically check the following to verify a camera is working:

1. **`navigator.mediaDevices.enumerateDevices()`** - Lists available cameras/microphones
2. **`navigator.mediaDevices.getUserMedia()`** - Requests camera access and returns a MediaStream
3. **`MediaStreamTrack.readyState`** - Should be 'live' for active tracks
4. **`MediaStreamTrack.muted`** - Should be false for unmuted tracks
5. **`MediaStreamTrack.enabled`** - Should be true for enabled tracks
6. **`MediaStream.active`** - Should be true for active streams
7. **`MediaStreamTrack.getSettings()`** - Returns current track settings (width, height, frameRate, etc.)
8. **`MediaStreamTrack.getCapabilities()`** - Returns track capabilities range
9. **`navigator.mediaDevices.getSupportedConstraints()`** - Returns supported constraint names
10. **Track label** - Should match a real camera name

## Protocol Compatibility

### Protocol 1: Standard Injection ✅ WORKS

**Status: FULLY COMPATIBLE**

This is the primary injection protocol and is fully compatible with webcam test sites after the recent fixes.

**How it works:**
- Overrides `navigator.mediaDevices.getUserMedia()` to return a canvas-based stream
- Overrides `navigator.mediaDevices.enumerateDevices()` to return simulated device info
- Comprehensively spoofs all MediaStreamTrack properties:
  - `readyState` → 'live'
  - `muted` → false
  - `enabled` → true (with setter support)
  - `label` → Device template name
  - `id` → Unique UUID
  - `getSettings()` → Full camera settings
  - `getCapabilities()` → Full capability ranges
  - `getConstraints()` → Applied constraints
  - `applyConstraints()` → Resolves successfully
  - `clone()` → Returns properly spoofed clone
- Spoofs MediaStream properties:
  - `active` → true
  - `id` → Unique UUID
- Provides `getSupportedConstraints()` with full constraint list

**Requirements:**
- At least one device template configured
- A video source (MP4/WebM) or uses green screen fallback

---

### Protocol 2: Advanced Relay ✅ WORKS

**Status: FULLY COMPATIBLE**

The most technically advanced protocol with WebRTC relay, GPU processing, and Adaptive Stream Intelligence.

**How it works:**
- Uses the same track spoofing as Protocol 1
- Additional features:
  - WebRTC peer connection interception
  - Adaptive Stream Intelligence for site-specific optimization
  - GPU-accelerated video processing
  - Cross-device streaming support
  - Cryptographic frame signing

**Requirements:**
- Developer Mode enabled
- Device templates configured

---

### Protocol 3: Protected Preview ✅ WORKS

**Status: FULLY COMPATIBLE**

Consent-based preview with body detection and safe video replacement.

**How it works:**
- Uses the same injection mechanism as Protocol 1
- Adds body detection layer that can swap to a safe video
- Falls back to green screen when body is detected

**Requirements:**
- Body detection model (optional)
- Replacement video configured (optional)

---

### Protocol 4: Local Test Harness ✅ WORKS

**Status: FULLY COMPATIBLE**

Local sandbox for testing without third-party sites.

**How it works:**
- Uses the same injection mechanism as Protocol 1
- Provides debug overlay and test patterns

**Requirements:**
- None

---

### Protocol 5: Holographic Stream Injection ⚠️ PARTIAL

**Status: REQUIRES WEBVIEW SUPPORT**

Advanced WebSocket bridge with SDP mutation.

**How it works:**
- Similar to Protocol 2 but with WebSocket-based video relay
- Uses SDP masquerading to emulate different camera types

**Limitations:**
- Requires WebSocket bridge server (not typically available in mobile WebViews)
- Works best with custom browser extensions or controlled environments

**Recommendation:**
- Use Protocol 1 or 2 instead for webcamtests.com/recorder
- Protocol 5 is designed for specialized use cases with external video sources

---

### Protocol 5 (Sonnet): AI-Powered Adaptive Injection ✅ ENHANCEMENT ONLY

**Status: NOT A STANDALONE PROTOCOL**

This is an enhancement layer, not a standalone injection protocol.

**How it works:**
- Provides AI-powered quality adaptation
- Behavioral mimicry for more realistic streams
- Biometric simulation (blink patterns, eye movement)
- Quantum timing randomness
- Does NOT override getUserMedia directly

**Usage:**
- Works alongside Protocol 1 or 2 to enhance realism
- Automatically adjusts quality based on performance metrics

---

## Recommended Configuration for webcamtests.com/recorder

For best results on webcamtests.com/recorder:

1. **Use Protocol 1: Standard Injection** or **Protocol 2: Advanced Relay**
2. **Ensure device templates are configured** with realistic camera names
3. **Provide a video source** (MP4 preferred) or the system will use a green screen
4. **Enable stealth mode** in settings

### Example Device Template Configuration:

```json
{
  "id": "front_camera",
  "name": "iPhone Front Camera",
  "type": "camera",
  "facing": "front",
  "nativeDeviceId": "camera:front:12345",
  "groupId": "default",
  "capabilities": {
    "videoResolutions": [
      { "width": 1080, "height": 1920, "maxFps": 60 },
      { "width": 720, "height": 1280, "maxFps": 60 }
    ]
  }
}
```

## Common Issues and Solutions

### Issue: Camera not detected

**Solution:** Ensure at least one device template is configured with `type: "camera"`.

### Issue: Black screen

**Solution:** Check that the video source is a valid MP4/WebM file. The system will fall back to green screen if the video fails to load.

### Issue: Site detects canvas capture

**Solution:** With the latest fixes, this should not happen. The track spoofing makes the canvas stream indistinguishable from a real camera. If issues persist, enable stealth mode.

### Issue: Track shows as muted

**Solution:** This is fixed in the latest version. The `muted` property is now properly spoofed to return `false`.

## Technical Details

### Properties Spoofed on MediaStreamTrack:

| Property | Value | Notes |
|----------|-------|-------|
| `readyState` | 'live' | Changes to 'ended' when stopped |
| `muted` | false | Always false for video |
| `enabled` | true | Settable by site |
| `kind` | 'video' | Standard video track |
| `id` | UUID v4 | Unique per track |
| `label` | Device name | From template |
| `contentHint` | '' | Settable by site |

### Methods Spoofed on MediaStreamTrack:

| Method | Behavior |
|--------|----------|
| `getSettings()` | Returns full camera settings |
| `getCapabilities()` | Returns capability ranges |
| `getConstraints()` | Returns applied constraints |
| `applyConstraints()` | Resolves immediately |
| `clone()` | Returns spoofed clone |
| `stop()` | Sets readyState to 'ended' |

### Properties Spoofed on MediaStream:

| Property | Value |
|----------|-------|
| `active` | true when tracks are live |
| `id` | UUID v4 |

### Methods Added to navigator.mediaDevices:

| Method | Behavior |
|--------|----------|
| `getSupportedConstraints()` | Returns full constraint support |
| `enumerateDevices()` | Returns simulated devices + audio |

## Version History

- **v1.0** - Initial comprehensive track spoofing implementation
- Fixes async/await syntax error in getUserMedia
- Fixes undefined `forceSimulation` reference
- Adds comprehensive track property spoofing
- Adds stream-level property spoofing
- Adds getSupportedConstraints override
- Enhances enumerateDevices with audio devices
