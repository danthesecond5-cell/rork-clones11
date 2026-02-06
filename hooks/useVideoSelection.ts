import { useState, useCallback, useRef, useEffect } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { useVideoLibrary } from '@/contexts/VideoLibraryContext';
import type { SavedVideo } from '@/utils/videoManager';
import type { CompatibilityResult } from '@/utils/compatibility';

export function useVideoSelection() {
  const {
    savedVideos,
    isLoading,
    removeVideo,
    refreshVideoList,
    regenerateVideoThumbnail,
    isVideoReady,
    checkCompatibility,
    setPendingVideoForApply,
  } = useVideoLibrary();

  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [compatibilityModalVisible, setCompatibilityModalVisible] = useState(false);
  const [compatibilityResult, setCompatibilityResult] = useState<CompatibilityResult | null>(null);
  const [isCheckingCompatibility, setIsCheckingCompatibility] = useState(false);
  const [checkingVideoName, setCheckingVideoName] = useState<string>('');
  
  const isProcessingRef = useRef(false);
  const processingTokenRef = useRef(0);
  const isMountedRef = useRef(true);
  const pendingTimeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    console.log('[useVideoSelection] Hook mounted');
    isMountedRef.current = true;
    abortControllerRef.current = new AbortController();
    
    return () => {
      console.log('[useVideoSelection] Hook unmounting, cleaning up...');
      isMountedRef.current = false;
      isProcessingRef.current = false;
      
      // Abort any pending operations
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      
      // Clear all pending timeouts
      pendingTimeoutsRef.current.forEach(timeoutId => clearTimeout(timeoutId));
      pendingTimeoutsRef.current.clear();
    };
  }, []);

  const handleRefresh = useCallback(async () => {
    if (!isMountedRef.current) return;
    setIsRefreshing(true);
    try {
      await refreshVideoList();
    } finally {
      if (isMountedRef.current) {
        setIsRefreshing(false);
      }
    }
  }, [refreshVideoList]);

  const handleSelectVideo = useCallback(async (video: SavedVideo) => {
    if (isProcessingRef.current || !isMountedRef.current) {
      console.log('[useVideoSelection] Already processing or unmounted, ignoring tap');
      return;
    }
    
    console.log('[useVideoSelection] User wants to use video:', video.name);
    const operationToken = ++processingTokenRef.current;
    isProcessingRef.current = true;
    
    // Track timeout state at function scope so it's accessible throughout
    let timedOut = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let navTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let resetTimeoutId: ReturnType<typeof setTimeout> | null = null;
    
    try {
      if (!isMountedRef.current) {
        isProcessingRef.current = false;
        return;
      }

      const isFullyCompatible =
        video.compatibility?.overallStatus === 'perfect' ||
        video.compatibility?.overallStatus === 'compatible';

      if (isFullyCompatible) {
        if (isVideoReady(video.id)) {
          console.log('[useVideoSelection] Setting pending video for apply:', video.name);
          
          if (!isMountedRef.current) {
            isProcessingRef.current = false;
            return;
          }
          
          setPendingVideoForApply(video);

          // Use timeout and track it for cleanup
          navTimeoutId = setTimeout(() => {
            if (isMountedRef.current) {
              router.back();
            }
            pendingTimeoutsRef.current.delete(navTimeoutId!);
          }, 0);
          pendingTimeoutsRef.current.add(navTimeoutId);
          return;
        }

        isProcessingRef.current = false;
        Alert.alert('Video File Missing', 'This video file is not available. It may have been deleted.');
        return;
      }
      
      if (!isMountedRef.current) {
        isProcessingRef.current = false;
        return;
      }
      
      setCheckingVideoName(video.name);
      setCompatibilityResult(null);
      setCompatibilityModalVisible(true);
      setIsCheckingCompatibility(true);
      
      let result: CompatibilityResult | null = null;
      
      try {
        timeoutId = setTimeout(() => {
          timedOut = true;
          console.warn('[useVideoSelection] Compatibility check timed out after 6 seconds');
          if (timeoutId) {
            pendingTimeoutsRef.current.delete(timeoutId);
          }
        }, 6000);
        pendingTimeoutsRef.current.add(timeoutId);
        
        result = await checkCompatibility(video);
        
        if (timeoutId) {
          clearTimeout(timeoutId);
          pendingTimeoutsRef.current.delete(timeoutId);
          timeoutId = null;
        }
        
        if (timedOut) {
          console.warn('[useVideoSelection] Check completed but timed out flag was set');
        }
      } catch (checkError) {
        console.error('[useVideoSelection] Compatibility check error:', checkError);
        result = null;
      }
      
      if (!isMountedRef.current) {
        console.log('[useVideoSelection] Unmounted during check, aborting');
        isProcessingRef.current = false;
        return;
      }
      
      setIsCheckingCompatibility(false);
      
      if (!result || timedOut) {
        if (isMountedRef.current) {
          setCompatibilityResult(null);
          setCompatibilityModalVisible(false);
        }
        isProcessingRef.current = false;
        Alert.alert('Error', 'Failed to check video compatibility. Please try again.');
        return;
      }
      
      if (!isMountedRef.current) {
        isProcessingRef.current = false;
        return;
      }
      
      setCompatibilityResult(result);
      console.log('[useVideoSelection] Compatibility result:', result.overallStatus, 'ready:', result.readyForSimulation);
      
      if (result.overallStatus === 'perfect' || result.overallStatus === 'compatible') {
        if (isVideoReady(video.id)) {
          console.log('[useVideoSelection] Setting pending video for apply:', video.name);
          
          if (!isMountedRef.current) {
            isProcessingRef.current = false;
            return;
          }
          
          // Close modal and mark as done BEFORE setting pending video to avoid race conditions
          setCompatibilityModalVisible(false);
          isProcessingRef.current = false;
          
          // Set pending video after modal is closed
          setPendingVideoForApply(video);
          
          // Use a slightly longer delay before navigating back to let state settle
          navTimeoutId = setTimeout(() => {
            if (isMountedRef.current) {
              console.log('[useVideoSelection] Navigating back to main screen');
              router.back();
            }
            pendingTimeoutsRef.current.delete(navTimeoutId!);
          }, 100);
          pendingTimeoutsRef.current.add(navTimeoutId);
          return;
        } else {
          if (isMountedRef.current) {
            setCompatibilityModalVisible(false);
          }
          isProcessingRef.current = false;
          Alert.alert('Video File Missing', 'This video file is not available. It may have been deleted.');
        }
      }
    } catch (error) {
      console.error('[useVideoSelection] handleSelectVideo error:', error);
      if (isMountedRef.current) {
        setIsCheckingCompatibility(false);
        setCompatibilityModalVisible(false);
      }
      isProcessingRef.current = false;
      Alert.alert('Error', 'An unexpected error occurred while selecting the video.');
    } finally {
      // Clean up timeout if still pending
      if (timeoutId) {
        clearTimeout(timeoutId);
        pendingTimeoutsRef.current.delete(timeoutId);
      }
      
      // Reset processing flag after a short delay with proper cleanup
      resetTimeoutId = setTimeout(() => {
        if (processingTokenRef.current === operationToken) {
          isProcessingRef.current = false;
        }
        pendingTimeoutsRef.current.delete(resetTimeoutId!);
      }, 300);
      pendingTimeoutsRef.current.add(resetTimeoutId);
    }
  }, [checkCompatibility, isVideoReady, setPendingVideoForApply]);

  const handleDeleteVideo = useCallback((videoId: string, videoName: string) => {
    Alert.alert(
      'Delete Video',
      `Are you sure you want to delete "${videoName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const removed = await removeVideo(videoId);
            if (!removed) {
              Alert.alert(
                'Protected Video',
                'The built-in sample video cannot be deleted.'
              );
              return;
            }
            if (selectedVideoId === videoId) {
              setSelectedVideoId(null);
            }
          },
        },
      ]
    );
  }, [removeVideo, selectedVideoId]);

  const handleRegenerateThumbnail = useCallback(async (videoId: string) => {
    setRegeneratingId(videoId);
    const success = await regenerateVideoThumbnail(videoId);
    setRegeneratingId(null);
    if (!success) {
      Alert.alert('Error', 'Failed to regenerate thumbnail');
    }
  }, [regenerateVideoThumbnail]);

  const handleCheckCompatibility = useCallback(async (video: SavedVideo) => {
    if (isProcessingRef.current || !isMountedRef.current) {
      console.log('[useVideoSelection] Already processing or unmounted, ignoring tap');
      return;
    }
    
    const operationToken = ++processingTokenRef.current;
    isProcessingRef.current = true;
    
    // Track timeout state at function scope
    let timedOut = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let resetTimeoutId: ReturnType<typeof setTimeout> | null = null;
    
    try {
      if (!isMountedRef.current) {
        isProcessingRef.current = false;
        return;
      }
      
      setCheckingVideoName(video.name);
      setCompatibilityResult(null);
      setCompatibilityModalVisible(true);
      setIsCheckingCompatibility(true);
      
      let result: CompatibilityResult | null = null;
      
      try {
        timeoutId = setTimeout(() => {
          timedOut = true;
          console.warn('[useVideoSelection] Compatibility check timed out after 6 seconds');
          if (timeoutId) {
            pendingTimeoutsRef.current.delete(timeoutId);
          }
        }, 6000);
        pendingTimeoutsRef.current.add(timeoutId);
        
        result = await checkCompatibility(video);
        
        if (timeoutId) {
          clearTimeout(timeoutId);
          pendingTimeoutsRef.current.delete(timeoutId);
          timeoutId = null;
        }
      } catch (checkError) {
        console.error('[useVideoSelection] Compatibility check error:', checkError);
        result = null;
      }
      
      if (!isMountedRef.current) {
        console.log('[useVideoSelection] Unmounted during check, aborting');
        isProcessingRef.current = false;
        return;
      }
      
      setIsCheckingCompatibility(false);
      
      if (!result || timedOut) {
        if (isMountedRef.current) {
          setCompatibilityResult(null);
          setCompatibilityModalVisible(false);
        }
        isProcessingRef.current = false;
        Alert.alert('Error', 'Compatibility check timed out or failed.');
        return;
      }
      
      if (!isMountedRef.current) {
        isProcessingRef.current = false;
        return;
      }
      
      setCompatibilityResult(result);
      
      if (!result.readyForSimulation) {
        console.log('[useVideoSelection] Video not compatible:', video.name, result.modifications);
      }
    } catch (error) {
      console.error('[useVideoSelection] handleCheckCompatibility error:', error);
      if (isMountedRef.current) {
        setIsCheckingCompatibility(false);
        setCompatibilityModalVisible(false);
      }
      isProcessingRef.current = false;
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      // Clean up timeout if still pending
      if (timeoutId) {
        clearTimeout(timeoutId);
        pendingTimeoutsRef.current.delete(timeoutId);
      }
      
      resetTimeoutId = setTimeout(() => {
        if (processingTokenRef.current === operationToken) {
          isProcessingRef.current = false;
        }
        pendingTimeoutsRef.current.delete(resetTimeoutId!);
      }, 300);
      pendingTimeoutsRef.current.add(resetTimeoutId);
    }
  }, [checkCompatibility]);

  const closeCompatibilityModal = useCallback(() => {
    setCompatibilityModalVisible(false);
  }, []);

  const toggleVideoSelection = useCallback((videoId: string) => {
    setSelectedVideoId(prev => prev === videoId ? null : videoId);
  }, []);

  return {
    savedVideos,
    isLoading,
    selectedVideoId,
    isRefreshing,
    regeneratingId,
    compatibilityModalVisible,
    compatibilityResult,
    isCheckingCompatibility,
    checkingVideoName,
    handleRefresh,
    handleSelectVideo,
    handleDeleteVideo,
    handleRegenerateThumbnail,
    handleCheckCompatibility,
    closeCompatibilityModal,
    toggleVideoSelection,
  };
}
