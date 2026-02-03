import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import Constants from 'expo-constants';

import type {
  NativeGumOfferPayload,
  NativeGumAnswerPayload,
  NativeGumIcePayload,
  NativeGumErrorPayload,
  NativeGumCancelPayload,
} from '@/types/nativeMediaBridge';

// Expo Go compatibility detection
const isExpoGo = Constants.appOwnership === 'expo';

// Log status in development
if (__DEV__) {
  console.log('[NativeMediaBridge] Expo Go mode:', isExpoGo);
  if (isExpoGo) {
    console.log('[NativeMediaBridge] Native WebRTC features disabled - use Protocol 6 WebSocket Bridge for best compatibility');
  }
}

type NativeBridgeHandlers = {
  onAnswer: (payload: NativeGumAnswerPayload) => void;
  onIceCandidate: (payload: NativeGumIcePayload) => void;
  onError: (payload: NativeGumErrorPayload) => void;
};

type NativeBridgeSession = {
  pc: any;
  stream: any | null;
};

const sessions = new Map<string, NativeBridgeSession>();

type WebRTCModule = {
  RTCPeerConnection: any;
  RTCSessionDescription: any;
  RTCIceCandidate: any;
  mediaDevices?: {
    getUserMedia: (constraints: MediaStreamConstraints) => Promise<any>;
  };
};

let webrtcModule: WebRTCModule | null | undefined = undefined;

/**
 * Get the WebRTC module (react-native-webrtc)
 * Returns null in Expo Go since native modules aren't available
 */
const getWebRTCModule = (): WebRTCModule | null => {
  // In Expo Go, native modules like react-native-webrtc are not available
  if (isExpoGo) {
    if (__DEV__ && webrtcModule === undefined) {
      console.log('[NativeMediaBridge] WebRTC module not available in Expo Go');
    }
    webrtcModule = null;
    return null;
  }
  
  if (webrtcModule !== undefined) {
    return webrtcModule;
  }
  
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    webrtcModule = require('react-native-webrtc');
    if (__DEV__) {
      console.log('[NativeMediaBridge] WebRTC module loaded successfully');
    }
  } catch (error) {
    if (__DEV__) {
      console.log('[NativeMediaBridge] WebRTC module not available:', (error as Error)?.message);
    }
    webrtcModule = null;
  }
  return webrtcModule;
};

let nativeBridge: {
  createSession?: (requestId: string, offer: RTCSessionDescriptionInit, constraints?: MediaStreamConstraints, rtcConfig?: RTCConfiguration) => Promise<RTCSessionDescriptionInit>;
  addIceCandidate?: (requestId: string, candidate: RTCIceCandidateInit) => Promise<void>;
  closeSession?: (requestId: string) => Promise<void>;
} | null = null;

// Only try to load native bridge if not in Expo Go
if (!isExpoGo) {
  try {
    // Try to load from NativeModules first
    nativeBridge = (NativeModules as any).NativeMediaBridge || null;
    
    // If not in NativeModules, try expo-modules-core
    if (!nativeBridge) {
      try {
        const { requireNativeModule } = require('expo-modules-core');
        nativeBridge = requireNativeModule('NativeMediaBridge');
      } catch {
        // Native module not available
      }
    }
    
    if (__DEV__ && nativeBridge) {
      console.log('[NativeMediaBridge] Native bridge loaded successfully');
    }
  } catch {
    nativeBridge = null;
  }
} else {
  if (__DEV__) {
    console.log('[NativeMediaBridge] Native bridge disabled in Expo Go');
  }
}

let nativeEmitter: NativeEventEmitter | null = null;
let nativeEmitterBound = false;

const ensureNativeEmitter = (handlers: NativeBridgeHandlers) => {
  if (!nativeBridge || nativeEmitterBound) return;
  nativeEmitter = new NativeEventEmitter(nativeBridge as any);
  nativeEmitter.addListener('nativeGumIce', (payload: NativeGumIcePayload) => {
    if (payload && payload.requestId && payload.candidate) {
      handlers.onIceCandidate(payload);
    }
  });
  nativeEmitter.addListener('nativeGumError', (payload: NativeGumErrorPayload) => {
    if (payload && payload.requestId) {
      handlers.onError(payload);
    }
  });
  nativeEmitterBound = true;
};

const DEFAULT_RTC_CONFIG: RTCConfiguration = {
  iceServers: [],
};

const buildError = (requestId: string, message: string, code?: string): NativeGumErrorPayload => ({
  requestId,
  message,
  code,
});

const normalizeConstraints = (constraints?: MediaStreamConstraints): MediaStreamConstraints => {
  if (!constraints) {
    return { video: true, audio: false };
  }
  const wantsVideo = constraints.video ?? true;
  const wantsAudio = constraints.audio ?? false;
  return { video: wantsVideo, audio: wantsAudio };
};

/**
 * Check if native WebRTC features are available
 * Returns false in Expo Go
 */
export function isNativeWebRTCAvailable(): boolean {
  if (isExpoGo) return false;
  if (Platform.OS !== 'ios') return false;
  return !!(nativeBridge?.createSession || getWebRTCModule());
}

/**
 * Handle native getUserMedia offer
 * In Expo Go, this will return an error suggesting to use Protocol 6 WebSocket Bridge
 */
export async function handleNativeGumOffer(
  payload: NativeGumOfferPayload,
  handlers: NativeBridgeHandlers
): Promise<void> {
  const requestId = payload?.requestId;
  if (!requestId) {
    return;
  }

  // Expo Go compatibility check - provide helpful error message
  if (isExpoGo) {
    handlers.onError(buildError(
      requestId, 
      'Native WebRTC is not available in Expo Go. Use Protocol 6 (WebSocket Bridge) for video injection, or create a development build to enable native WebRTC.',
      'expo_go_incompatible'
    ));
    return;
  }

  if (Platform.OS !== 'ios') {
    handlers.onError(buildError(requestId, 'Native bridge only enabled on iOS', 'platform'));
    return;
  }

  if (nativeBridge?.createSession) {
    try {
      ensureNativeEmitter(handlers);
      const answer = await nativeBridge.createSession(
        requestId,
        payload.offer,
        payload.constraints,
        payload.rtcConfig
      );
      handlers.onAnswer({ requestId, answer });
      return;
    } catch (error) {
      handlers.onError(buildError(requestId, (error as Error)?.message || 'Native bridge error', 'native'));
      return;
    }
  }

  const webrtc = getWebRTCModule();
  if (!webrtc || typeof webrtc.RTCPeerConnection !== 'function' || !webrtc.mediaDevices?.getUserMedia) {
    handlers.onError(buildError(
      requestId, 
      'react-native-webrtc is not available. Use Protocol 6 (WebSocket Bridge) or create a development build.',
      'missing_dependency'
    ));
    return;
  }

  try {
    const pc = new webrtc.RTCPeerConnection(payload?.rtcConfig || DEFAULT_RTC_CONFIG);
    sessions.set(requestId, { pc, stream: null });

    pc.onicecandidate = (event: any) => {
      if (event.candidate) {
        handlers.onIceCandidate({
          requestId,
          candidate: event.candidate.toJSON ? event.candidate.toJSON() : event.candidate,
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        handlers.onError(buildError(requestId, 'Native WebRTC connection failed', pc.connectionState));
        closeNativeGumSession({ requestId });
      }
    };

    // NOTE: This currently uses the real camera. Replace with a custom video capturer
    // for file-backed or synthetic streams once the iOS native module is ready.
    const stream = await webrtc.mediaDevices.getUserMedia(normalizeConstraints(payload?.constraints));
    sessions.set(requestId, { pc, stream });

    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    await pc.setRemoteDescription(new webrtc.RTCSessionDescription(payload.offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    handlers.onAnswer({
      requestId,
      answer: pc.localDescription?.toJSON ? pc.localDescription.toJSON() : pc.localDescription!,
    });
  } catch (error) {
    handlers.onError(buildError(requestId, (error as Error)?.message || 'Native bridge error', 'exception'));
    closeNativeGumSession({ requestId });
  }
}

export async function handleNativeGumIceCandidate(payload: NativeGumIcePayload): Promise<void> {
  const requestId = payload?.requestId;
  const candidate = payload?.candidate;
  if (!requestId || !candidate) return;

  const webrtc = getWebRTCModule();
  if (!webrtc?.RTCIceCandidate) return;

  if (nativeBridge?.addIceCandidate) {
    try {
      await nativeBridge.addIceCandidate(requestId, candidate);
    } catch {
      // Ignore ICE errors
    }
    return;
  }

  const session = sessions.get(requestId);
  if (!session) return;

  try {
    await session.pc.addIceCandidate(new webrtc.RTCIceCandidate(candidate));
  } catch {
    // Ignore ICE errors for now (common during teardown).
  }
}

export function closeNativeGumSession(payload: NativeGumCancelPayload): void {
  const requestId = payload?.requestId;
  if (!requestId) return;

  if (nativeBridge?.closeSession) {
    nativeBridge.closeSession(requestId).catch(() => {});
    return;
  }

  const session = sessions.get(requestId);
  if (!session) return;

  try {
    session.stream?.getTracks().forEach((track) => track.stop());
  } catch {}

  try {
    session.pc.close();
  } catch {}

  sessions.delete(requestId);
}
