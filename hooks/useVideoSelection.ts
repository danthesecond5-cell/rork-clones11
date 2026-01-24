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
    selectVideoForSimulation,
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
  const isMountedRef = useRef(true);

  useEffect(() => {
    console.log('[useVideoSelection] Hook mounted');
    isMountedRef.current = true;
    
    return () => {
      console.log('[useVideoSelection] Hook unmounting, cleaning up...');
      isMountedRef.current = false;
      isProcessingRef.current = false;
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
    isProcessingRef.current = true;
    
    try {
      if (!isMountedRef.current) return;

      const selectedVideo = selectVideoForSimulation(video.id);
      if (selectedVideo) {
        console.log('[useVideoSelection] Setting pending video for apply:', selectedVideo.name);
        setPendingVideoForApply(selectedVideo);

        requestAnimationFrame(() => {
          if (isMountedRef.current) {
            router.back();
          }
        });
        return;
      }

      Alert.alert('Video Not Ready', 'This video file is not available. It may have been deleted.');
    } catch (error) {
      console.error('[useVideoSelection] handleSelectVideo error:', error);
      if (isMountedRef.current) {
        setIsCheckingCompatibility(false);
        setCompatibilityModalVisible(false);
      }
      Alert.alert('Error', 'An unexpected error occurred while selecting the video.');
    } finally {
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 300);
    }
  }, [selectVideoForSimulation, setPendingVideoForApply]);

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
            await removeVideo(videoId);
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
    if (isProcessingRef.current) {
      console.log('[useVideoSelection] Already processing, ignoring tap');
      return;
    }
    
    isProcessingRef.current = true;
    
    try {
      setCheckingVideoName(video.name);
      setCompatibilityResult(null);
      setCompatibilityModalVisible(true);
      setIsCheckingCompatibility(true);
      
      let result: CompatibilityResult | null = null;
      let timedOut = false;
      
      try {
        const timeoutId = setTimeout(() => {
          timedOut = true;
        }, 6000);
        
        result = await checkCompatibility(video.id);
        clearTimeout(timeoutId);
      } catch (checkError) {
        console.error('[useVideoSelection] Compatibility check error:', checkError);
        result = null;
      }
      
      setIsCheckingCompatibility(false);
      
      if (!result || timedOut) {
        setCompatibilityResult(null);
        setCompatibilityModalVisible(false);
        Alert.alert('Error', 'Compatibility check timed out or failed.');
        return;
      }
      
      setCompatibilityResult(result);
      
      if (!result.readyForSimulation) {
        console.log('[useVideoSelection] Video not compatible:', video.name, result.modifications);
      }
    } catch (error) {
      console.error('[useVideoSelection] handleCheckCompatibility error:', error);
      setIsCheckingCompatibility(false);
      setCompatibilityModalVisible(false);
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 300);
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
