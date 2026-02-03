/**
 * Virtual Camera Module
 * 
 * This native module provides a virtual camera that intercepts camera frames
 * at the native level, completely bypassing JavaScript-based detection.
 * 
 * How it works:
 * 1. iOS: Uses AVFoundation to create a custom AVCaptureSession that reads
 *    frames from a video file instead of the camera sensor
 * 2. Android: Uses Camera2 API to create a virtual camera device that
 *    provides frames from a video file
 * 
 * NOTE: This module is NOT available in Expo Go. It requires a development
 * build with custom native modules.
 * 
 * Usage:
 * ```typescript
 * import VirtualCamera from '@/modules/virtual-camera';
 * 
 * // Check if available (will be false in Expo Go)
 * if (!VirtualCamera.isAvailable()) {
 *   console.log('VirtualCamera not available - use WebView-based injection');
 *   return;
 * }
 * 
 * // Set the video source
 * await VirtualCamera.setVideoSource('/path/to/video.mp4');
 * 
 * // Enable virtual camera (all camera access will use this video)
 * await VirtualCamera.enable();
 * 
 * // Navigate to webcamtests.com - it will see your video as the camera
 * 
 * // Disable when done
 * await VirtualCamera.disable();
 * ```
 */

import { EventEmitter, Subscription } from 'expo-modules-core';
import Constants from 'expo-constants';

// Check if running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Try to load the native module, but handle the case when it's not available
let VirtualCameraModule: any = null;
if (!isExpoGo) {
  try {
    VirtualCameraModule = require('./VirtualCameraModule').default;
  } catch (error) {
    console.log('[VirtualCamera] Native module not available');
  }
}

export type VirtualCameraStatus = 'disabled' | 'enabled' | 'error';

export type VirtualCameraConfig = {
  /** Path to the video file to use as camera source */
  videoUri: string;
  /** Whether to loop the video */
  loop?: boolean;
  /** Target width (will scale video to fit) */
  width?: number;
  /** Target height (will scale video to fit) */
  height?: number;
  /** Target FPS */
  fps?: number;
  /** Mirror the video horizontally (for front camera simulation) */
  mirror?: boolean;
};

export type VirtualCameraState = {
  status: VirtualCameraStatus;
  videoUri: string | null;
  isPlaying: boolean;
  currentFrame: number;
  totalFrames: number;
  fps: number;
  width: number;
  height: number;
  error: string | null;
};

export type VirtualCameraEvent = {
  type: 'statusChanged' | 'frameRendered' | 'videoLoaded' | 'error';
  payload: any;
};

// Get the native module (may be null in Expo Go)
const VirtualCameraNative = VirtualCameraModule;

// Event emitter for native events (only create if module is available)
let emitter: EventEmitter | null = null;
if (VirtualCameraNative) {
  try {
    emitter = new EventEmitter(VirtualCameraNative);
  } catch (error) {
    console.log('[VirtualCamera] Could not create event emitter');
  }
}

/**
 * Virtual Camera API
 */
export const VirtualCamera = {
  /**
   * Check if the virtual camera module is available
   * Returns false in Expo Go as native modules are not supported
   */
  isAvailable(): boolean {
    if (isExpoGo) {
      return false;
    }
    return VirtualCameraNative !== null && VirtualCameraNative !== undefined;
  },

  /**
   * Check if running in Expo Go
   */
  isExpoGo(): boolean {
    return isExpoGo;
  },

  /**
   * Get the current state of the virtual camera
   */
  async getState(): Promise<VirtualCameraState> {
    if (!this.isAvailable()) {
      return {
        status: 'disabled',
        videoUri: null,
        isPlaying: false,
        currentFrame: 0,
        totalFrames: 0,
        fps: 0,
        width: 0,
        height: 0,
        error: 'Module not available',
      };
    }
    return await VirtualCameraNative.getState();
  },

  /**
   * Configure and enable the virtual camera with a video source
   */
  async enable(config: VirtualCameraConfig): Promise<boolean> {
    if (!this.isAvailable()) {
      console.warn('[VirtualCamera] Module not available');
      return false;
    }

    try {
      const result = await VirtualCameraNative.enable({
        videoUri: config.videoUri,
        loop: config.loop ?? true,
        width: config.width ?? 1080,
        height: config.height ?? 1920,
        fps: config.fps ?? 30,
        mirror: config.mirror ?? false,
      });
      
      return result;
    } catch (error) {
      console.error('[VirtualCamera] Enable failed:', error);
      return false;
    }
  },

  /**
   * Disable the virtual camera (revert to real camera)
   */
  async disable(): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      return await VirtualCameraNative.disable();
    } catch (error) {
      console.error('[VirtualCamera] Disable failed:', error);
      return false;
    }
  },

  /**
   * Set the video source for the virtual camera
   */
  async setVideoSource(videoUri: string): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      return await VirtualCameraNative.setVideoSource(videoUri);
    } catch (error) {
      console.error('[VirtualCamera] setVideoSource failed:', error);
      return false;
    }
  },

  /**
   * Seek to a specific position in the video
   */
  async seekTo(position: number): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      return await VirtualCameraNative.seekTo(position);
    } catch (error) {
      console.error('[VirtualCamera] seekTo failed:', error);
      return false;
    }
  },

  /**
   * Pause the video playback
   */
  async pause(): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      return await VirtualCameraNative.pause();
    } catch (error) {
      console.error('[VirtualCamera] pause failed:', error);
      return false;
    }
  },

  /**
   * Resume the video playback
   */
  async resume(): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      return await VirtualCameraNative.resume();
    } catch (error) {
      console.error('[VirtualCamera] resume failed:', error);
      return false;
    }
  },

  /**
   * Get the current frame as a base64 encoded image
   */
  async getCurrentFrame(): Promise<string | null> {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      return await VirtualCameraNative.getCurrentFrame();
    } catch (error) {
      console.error('[VirtualCamera] getCurrentFrame failed:', error);
      return null;
    }
  },

  /**
   * Subscribe to virtual camera events
   * Returns a no-op subscription if module is not available
   */
  addListener(callback: (event: VirtualCameraEvent) => void): Subscription {
    if (!emitter) {
      // Return a no-op subscription for Expo Go compatibility
      return {
        remove: () => {},
      } as Subscription;
    }
    return emitter.addListener('onVirtualCameraEvent', callback);
  },

  /**
   * Remove event listener
   */
  removeSubscription(subscription: Subscription): void {
    if (subscription && subscription.remove) {
      subscription.remove();
    }
  },

  /**
   * Get info about why the module might not be available
   */
  getUnavailableReason(): string | null {
    if (isExpoGo) {
      return 'VirtualCamera is not available in Expo Go. Create a development build to use native camera injection.';
    }
    if (!VirtualCameraNative) {
      return 'VirtualCamera native module is not installed or configured properly.';
    }
    return null;
  },
};

export default VirtualCamera;
