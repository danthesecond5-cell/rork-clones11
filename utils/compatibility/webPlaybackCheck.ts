import { Platform } from 'react-native';
import type { SavedVideo } from '../videoManager';
import type { CompatibilityResult } from './types';
import { checkVideoCompatibility } from './checkVideoCompatibility';
import { getAspectRatioString } from './helpers';

const createFallbackResult = (): CompatibilityResult => {
  return {
    overallStatus: 'warning',
    score: 50,
    items: [],
    summary: 'Could not fully analyze video. It may still work.',
    readyForSimulation: true,
    requiresModification: false,
    modifications: [],
  };
};

export const checkVideoCompatibilityWithPlayback = async (
  video: SavedVideo
): Promise<CompatibilityResult> => {
  console.log('[CompatibilityChecker] ========== PLAYBACK CHECK START ==========');
  console.log('[CompatibilityChecker] Platform:', Platform.OS);
  console.log('[CompatibilityChecker] Video:', video.name, video.uri);
  
  if (Platform.OS !== 'web') {
    console.log('[CompatibilityChecker] Non-web platform, using standard check');
    try {
      const result = await checkVideoCompatibility(video);
      console.log('[CompatibilityChecker] Standard check completed successfully');
      return result;
    } catch (error) {
      console.error('[CompatibilityChecker] ERROR in standard check:', error);
      throw error;
    }
  }
  
  console.log('[CompatibilityChecker] Web platform, using playback check');
  
  // Create a hard timeout promise that will ALWAYS resolve after 4 seconds
  const hardTimeout = new Promise<CompatibilityResult>((resolve) => {
    setTimeout(() => {
      console.warn('[CompatibilityChecker] HARD TIMEOUT - forcing fallback after 4 seconds');
      // Immediately resolve with fallback result to prevent any further delays
      resolve(createFallbackResult());
    }, 4000);
  });
  
  // Race between the hard timeout and the actual video check
  const videoCheckPromise = new Promise<CompatibilityResult>((resolve) => {
    if (typeof document === 'undefined') {
      console.log('[CompatibilityChecker] No document available, falling back');
      checkVideoCompatibility(video).then((result) => {
        console.log('[CompatibilityChecker] Fallback check completed');
        resolve(result);
      }).catch((error) => {
        console.error('[CompatibilityChecker] Fallback check error:', error);
        resolve(createFallbackResult());
      });
      return;
    }
    
    let resolved = false;
    const videoEl = document.createElement('video');
    videoEl.preload = 'metadata';
    videoEl.muted = true;
    videoEl.playsInline = true;
    
    const cleanup = () => {
      try {
        videoEl.onloadedmetadata = null;
        videoEl.onerror = null;
        videoEl.onabort = null;
        videoEl.src = '';
        videoEl.load();
      } catch (e) {
        console.warn('[CompatibilityChecker] Cleanup error:', e);
      }
    };
    
    const safeResolve = async (result: CompatibilityResult) => {
      if (resolved) {
        console.log('[CompatibilityChecker] Already resolved, skipping');
        return;
      }
      resolved = true;
      console.log('[CompatibilityChecker] Resolving with result:', result.overallStatus, result.score);
      cleanup();
      resolve(result);
    };
    
    const timeout = setTimeout(() => {
      console.warn('[CompatibilityChecker] Web metadata timeout after 3 seconds');
      console.log('[CompatibilityChecker] Attempting fallback check...');
      
      // Immediately abort the video element to prevent hanging
      if (!resolved) {
        try {
          videoEl.src = '';
          videoEl.load();
        } catch (e) {
          console.warn('[CompatibilityChecker] Error aborting video:', e);
        }
      }
      
      checkVideoCompatibility(video).then((result) => {
        console.log('[CompatibilityChecker] Timeout fallback completed');
        safeResolve(result);
      }).catch((error) => {
        console.error('[CompatibilityChecker] Timeout fallback error:', error);
        safeResolve(createFallbackResult());
      });
    }, 3000);
    
    videoEl.onloadedmetadata = () => {
      clearTimeout(timeout);
      console.log('[CompatibilityChecker] ========== WEB METADATA LOADED ==========');
      
      const width = videoEl.videoWidth;
      const height = videoEl.videoHeight;
      const duration = videoEl.duration;
      
      console.log('[CompatibilityChecker] Video element dimensions:', { width, height, duration });
      console.log('[CompatibilityChecker] Video ready state:', videoEl.readyState);
      
      const enhancedVideo: SavedVideo = {
        ...video,
        metadata: {
          ...video.metadata,
          width,
          height,
          duration,
          orientation: height > width ? 'portrait' : 'landscape',
          aspectRatio: getAspectRatioString(width, height),
          isVertical: height > width,
        },
      };
      
      console.log('[CompatibilityChecker] Running compatibility check with enhanced metadata...');
      checkVideoCompatibility(enhancedVideo).then((result) => {
        console.log('[CompatibilityChecker] Enhanced check completed');
        safeResolve(result);
      }).catch((error) => {
        console.error('[CompatibilityChecker] Enhanced check error:', error);
        safeResolve(createFallbackResult());
      });
    };
    
    videoEl.onerror = (event) => {
      clearTimeout(timeout);
      console.error('[CompatibilityChecker] Web video element error:', event);
      console.error('[CompatibilityChecker] Video error code:', videoEl.error?.code);
      console.error('[CompatibilityChecker] Video error message:', videoEl.error?.message);
      checkVideoCompatibility(video).then((result) => {
        console.log('[CompatibilityChecker] Error fallback completed');
        safeResolve(result);
      }).catch((fallbackError) => {
        console.error('[CompatibilityChecker] Error fallback failed:', fallbackError);
        safeResolve(createFallbackResult());
      });
    };
    
    videoEl.onabort = () => {
      clearTimeout(timeout);
      console.warn('[CompatibilityChecker] Video load aborted');
      checkVideoCompatibility(video).then((result) => {
        console.log('[CompatibilityChecker] Abort fallback completed');
        safeResolve(result);
      }).catch((error) => {
        console.error('[CompatibilityChecker] Abort fallback error:', error);
        safeResolve(createFallbackResult());
      });
    };
    
    try {
      console.log('[CompatibilityChecker] Setting video src:', video.uri);
      videoEl.src = video.uri;
      console.log('[CompatibilityChecker] Video src set successfully, waiting for metadata...');
    } catch (e) {
      clearTimeout(timeout);
      console.error('[CompatibilityChecker] CRITICAL: Failed to set video src:', e);
      console.error('[CompatibilityChecker] Error details:', e instanceof Error ? e.message : 'Unknown');
      checkVideoCompatibility(video).then((result) => {
        console.log('[CompatibilityChecker] Src error fallback completed');
        safeResolve(result);
      }).catch((fallbackError) => {
        console.error('[CompatibilityChecker] Src error fallback failed:', fallbackError);
        safeResolve(createFallbackResult());
      });
    }
    console.log('[CompatibilityChecker] ========== PLAYBACK CHECK SETUP COMPLETE ==========');
  });
  
  // Race between the video check and the hard timeout to prevent freezing
  return Promise.race([videoCheckPromise, hardTimeout]);
};
