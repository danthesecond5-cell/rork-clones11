import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Keyboard,
  Alert,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import {
  Camera,
  Smartphone,
  ChevronRight,
  Copy,
  Zap,
  Info,
  Film,
  Repeat,
  Play,
  Upload,
  Download,
  FolderOpen,
  CheckCircle,
  XCircle,

} from 'lucide-react-native';
import { useVideoLibrary } from '@/contexts/VideoLibraryContext';
import type { DeviceTemplate, CaptureDevice } from '@/types/device';
import type { VideoSourceType } from '@/types/browser';
import {
  SAMPLE_VIDEOS,
  findBestMatchingResolution,
  getResolutionLabel,
  formatDuration,
  type SampleVideo,
  type SampleVideoResolution,
} from '@/constants/sampleVideos';
import {
  validateVideoUrl,
  DEFAULT_VALIDATION_CONFIG,
  type VideoValidationResult,
  type VideoLoadingError,
  extractVideoExtension,
  testVideoPlayability,
} from '@/utils/videoValidation';
import {
  isKnownCorsBlockingSite,
} from '@/utils/videoServing';
import DeviceCard from './DeviceCard';
import {
  TemplateInfoModal,
  CameraInfoModal,
  VideoLibraryModal,
  VideoPreviewModal,
  VideoValidationModal,
  RestartRequiredModal,
  PlaybackTestModal,
  CompatibilityCheckModal,
} from './modals';
import type { CompatibilityResult } from '@/utils/videoCompatibilityChecker';
import type { SavedVideo } from '@/utils/videoManager';

interface DevicesListProps {
  activeTemplate: DeviceTemplate | null;
  autoAcceptPermissions: boolean;
  stealthMode: boolean;
  onAutoAcceptToggle: () => void;
  onStealthModeToggle: () => void;
  onTemplateHeaderPress: () => void;
  onDeviceCheckPress: () => void;
  onOpenMyVideos?: () => void;
  onPickVideo: (deviceId: string) => void;
  onPickVideoForAll: () => void;
  onApplyVideoUrl: (deviceId: string, url: string, autoEnableSim?: boolean) => void;
  onApplyVideoToAll: (url: string, videoName: string, autoEnableSim?: boolean) => void;
  onToggleDeviceSimulation: (deviceId: string) => void;
  onClearDeviceVideo: (deviceId: string) => void;
  onRestartRequired?: () => void;
  onSaveVideoToLibrary?: (uri: string, name: string) => Promise<SavedVideo | null>;
}

export default function DevicesList({
  activeTemplate,
  autoAcceptPermissions,
  stealthMode,
  onAutoAcceptToggle,
  onStealthModeToggle,
  onTemplateHeaderPress,
  onDeviceCheckPress,
  onOpenMyVideos,
  onPickVideo,
  onPickVideoForAll,
  onApplyVideoUrl,
  onApplyVideoToAll,
  onToggleDeviceSimulation,
  onClearDeviceVideo,
  onRestartRequired,
  onSaveVideoToLibrary,
}: DevicesListProps) {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [videoSourceType, setVideoSourceType] = useState<VideoSourceType>('url');
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [applyToAllUrl, setApplyToAllUrl] = useState('');
  const [showSampleUrls, setShowSampleUrls] = useState(false);
  const [showTemplateInfo, setShowTemplateInfo] = useState(false);
  const [selectedCameraInfo, setSelectedCameraInfo] = useState<CaptureDevice | null>(null);
  const [showVideoLibrary, setShowVideoLibrary] = useState(false);
  const [previewVideo, setPreviewVideo] = useState<{ video: SampleVideo; resolution: SampleVideoResolution } | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<VideoValidationResult | null>(null);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [pendingVideoUrl, setPendingVideoUrl] = useState('');
  const [pendingDeviceId, setPendingDeviceId] = useState<string | null>(null);
  const [pendingApplyToAll, setPendingApplyToAll] = useState(false);
  const [showRestartModal, setShowRestartModal] = useState(false);
  
  const [showPlaybackTest, setShowPlaybackTest] = useState(false);
  const [playbackTestStatus, setPlaybackTestStatus] = useState<'testing' | 'success' | 'failed'>('testing');
  const [playbackTestError, setPlaybackTestError] = useState<string | null>(null);
  const [playbackTestUrl, setPlaybackTestUrl] = useState('');

  const {
    savedVideos,
    processingState,
    downloadAndSaveVideo,
    clearProcessingState,
    checkCompatibility,
  } = useVideoLibrary();

  const [compatibilityModalVisible, setCompatibilityModalVisible] = useState(false);
  const [compatibilityResult, setCompatibilityResult] = useState<CompatibilityResult | null>(null);
  const [isCheckingCompatibility, setIsCheckingCompatibility] = useState(false);
  const [checkingVideoName, setCheckingVideoName] = useState<string>('');
  const [pendingSavedVideo, setPendingSavedVideo] = useState<SavedVideo | null>(null);
  const [pendingApplyTarget, setPendingApplyTarget] = useState<'all' | string | null>(null);

  const detectedResolution = useMemo(() => {
    if (!activeTemplate?.captureDevices.length) return { width: 1080, height: 1920, fps: 30 };
    const primaryCamera = activeTemplate.captureDevices.find(d => d.isPrimary || d.isDefault) || activeTemplate.captureDevices[0];
    const videoRes = primaryCamera.capabilities?.videoResolutions?.[0];
    return {
      width: videoRes?.width || 1920,
      height: videoRes?.height || 1080,
      fps: videoRes?.maxFps || 30,
    };
  }, [activeTemplate]);

  const matchedSampleVideos = useMemo(() => {
    return SAMPLE_VIDEOS.map(video => {
      const resolution = findBestMatchingResolution(
        video,
        detectedResolution.width,
        detectedResolution.height,
        detectedResolution.fps
      );
      return { video, resolution };
    }).filter(item => item.resolution !== null) as { video: SampleVideo; resolution: SampleVideoResolution }[];
  }, [detectedResolution]);

  const runQuickPlaybackTest = useCallback(async (url: string): Promise<{ success: boolean; error?: VideoLoadingError }> => {
    console.log('[DevicesList] Running quick playback test for:', url);
    const result = await testVideoPlayability(url, 12000);
    if (result.playable) {
      console.log('[DevicesList] Playback test passed', result.metadata);
      return { success: true };
    } else {
      console.log('[DevicesList] Playback test failed:', result.error?.message);
      return { success: false, error: result.error };
    }
  }, []);

  const applyValidatedVideo = useCallback(async (url: string, deviceId: string | null, applyToAll: boolean) => {
    console.log('[DevicesList] Applying validated video:', { url, deviceId, applyToAll });
    
    setPlaybackTestUrl(url);
    setPlaybackTestStatus('testing');
    setPlaybackTestError(null);
    setShowPlaybackTest(true);
    
    const testResult = await runQuickPlaybackTest(url);
    
    if (!testResult.success) {
      console.log('[DevicesList] Playback test failed:', testResult.error?.message);
      setPlaybackTestStatus('failed');
      setPlaybackTestError(testResult.error?.message + '\n\n' + testResult.error?.solution || 'Video playback test failed');
      return;
    }
    
    console.log('[DevicesList] Playback test passed, applying video');
    setPlaybackTestStatus('success');
    
    setTimeout(() => {
      if (applyToAll) {
        onApplyVideoToAll(url, 'Validated Video', true);
        setApplyToAllUrl('');
      } else if (deviceId) {
        onApplyVideoUrl(deviceId, url, true);
        setVideoUrlInput('');
        setSelectedDeviceId(null);
      }
      
      Keyboard.dismiss();
      setShowPlaybackTest(false);
      setShowRestartModal(true);
      
      console.log('[DevicesList] Video applied, showing restart modal');
    }, 800);
  }, [onApplyVideoUrl, onApplyVideoToAll, runQuickPlaybackTest]);

  const validateAndApplyVideo = useCallback(async (url: string, deviceId: string | null, applyToAll: boolean) => {
    console.log('[DevicesList] Starting video validation:', { url, deviceId, applyToAll });
    
    if (url.startsWith('canvas:')) {
      console.log('[DevicesList] Canvas URL detected, skipping validation');
      applyValidatedVideo(url, deviceId, applyToAll);
      return;
    }
    
    const hasValidExtension = extractVideoExtension(url) !== null;
    
    if (hasValidExtension) {
      console.log('[DevicesList] Valid video extension detected, applying directly');
      applyValidatedVideo(url, deviceId, applyToAll);
      return;
    }
    
    setIsValidating(true);
    setPendingVideoUrl(url);
    setPendingDeviceId(deviceId);
    setPendingApplyToAll(applyToAll);
    setValidationResult(null);
    
    try {
      const urlResult = await validateVideoUrl(url, DEFAULT_VALIDATION_CONFIG);
      console.log('[DevicesList] URL validation result:', urlResult);
      
      if (!urlResult.isValid) {
        setValidationResult(urlResult);
        setShowValidationModal(true);
        setIsValidating(false);
        return;
      }
      
      applyValidatedVideo(url, deviceId, applyToAll);
      
    } catch (error) {
      console.error('[DevicesList] Validation error:', error);
      console.log('[DevicesList] Applying video anyway despite error');
      applyValidatedVideo(url, deviceId, applyToAll);
    } finally {
      setIsValidating(false);
    }
  }, [applyValidatedVideo]);

  const handleApplyUrl = useCallback((deviceId: string) => {
    if (videoUrlInput.trim()) {
      validateAndApplyVideo(videoUrlInput.trim(), deviceId, false);
    }
  }, [videoUrlInput, validateAndApplyVideo]);

  const runCompatibilityCheck = useCallback(async (video: SavedVideo, applyTarget: 'all' | string) => {
    console.log('[DevicesList] Running compatibility check for:', video.name);
    setCheckingVideoName(video.name);
    setCompatibilityResult(null);
    setCompatibilityModalVisible(true);
    setIsCheckingCompatibility(true);
    setPendingSavedVideo(video);
    setPendingApplyTarget(applyTarget);
    
    let result: CompatibilityResult | null = null;
    
    try {
      result = await checkCompatibility(video);
    } catch (error) {
      console.error('[DevicesList] Compatibility check failed:', error);
    }
    
    setIsCheckingCompatibility(false);
    
    if (!result) {
      console.warn('[DevicesList] Compatibility check returned null, using fallback');
      setCompatibilityResult({
        overallStatus: 'warning',
        score: 50,
        items: [],
        summary: 'Could not fully analyze video. It may still work.',
        readyForSimulation: true,
        requiresModification: false,
        modifications: [],
      });
      return;
    }
    
    setCompatibilityResult(result);
    console.log('[DevicesList] Compatibility result:', result.overallStatus, 'ready:', result.readyForSimulation);
  }, [checkCompatibility]);

  const handleApplyCompatibleVideo = useCallback(() => {
    if (!pendingSavedVideo || !pendingApplyTarget || !compatibilityResult?.readyForSimulation) {
      console.log('[DevicesList] Cannot apply video - not compatible');
      return;
    }
    
    console.log('[DevicesList] Applying compatible video:', pendingSavedVideo.name);
    
    if (pendingApplyTarget === 'all') {
      onApplyVideoToAll(pendingSavedVideo.uri, pendingSavedVideo.name, true);
    } else {
      onApplyVideoUrl(pendingApplyTarget, pendingSavedVideo.uri, true);
    }
    
    setCompatibilityModalVisible(false);
    setShowRestartModal(true);
    setPendingSavedVideo(null);
    setPendingApplyTarget(null);
    Keyboard.dismiss();
  }, [pendingSavedVideo, pendingApplyTarget, compatibilityResult, onApplyVideoToAll, onApplyVideoUrl]);

  const executeDownload = useCallback(async (url: string) => {
    const result = await downloadAndSaveVideo(url);
    
    if (result) {
      setApplyToAllUrl('');
      Keyboard.dismiss();
      
      setTimeout(() => {
        clearProcessingState();
      }, 500);
      
      runCompatibilityCheck(result, 'all');
    }
  }, [downloadAndSaveVideo, clearProcessingState, runCompatibilityCheck]);

  

  const handleDownloadAndSave = useCallback(async () => {
    if (!applyToAllUrl.trim()) return;
    
    const url = applyToAllUrl.trim();
    console.log('[DevicesList] Starting download and save:', url);
    
    if (isKnownCorsBlockingSite(url)) {
      Alert.alert(
        'Download Recommended',
        'This video source often blocks direct playback. The video will be downloaded to your device for reliable simulation.',
        [{ text: 'Continue', onPress: async () => await executeDownload(url) }]
      );
      return;
    }
    
    await executeDownload(url);
  }, [applyToAllUrl, executeDownload]);

  const handleOpenMyVideos = useCallback(() => {
    if (onOpenMyVideos) {
      onOpenMyVideos();
      return;
    }
    router.push('/my-videos');
  }, [onOpenMyVideos]);

  const handleQuickApplySample = useCallback((item: { video: SampleVideo; resolution: SampleVideoResolution }) => {
    const isCanvasVideo = item.resolution.url.startsWith('canvas:');
    
    if (!isCanvasVideo && item.video.duration && item.video.duration > DEFAULT_VALIDATION_CONFIG.maxDurationSeconds) {
      Alert.alert(
        'Video Too Long',
        `This sample video is ${formatDuration(item.video.duration)} long, which exceeds the ${DEFAULT_VALIDATION_CONFIG.maxDurationSeconds} second maximum. Please choose a shorter video.`,
        [{ text: 'OK' }]
      );
      return;
    }
    
    onApplyVideoToAll(item.resolution.url, `${item.video.name} (${item.resolution.label})`, true);
    setShowSampleUrls(false);
    setShowVideoLibrary(false);
    setShowRestartModal(true);
    console.log('[DevicesList] Quick applied sample video to all:', item.video.name, item.resolution.label, isCanvasVideo ? '(canvas)' : '');
  }, [onApplyVideoToAll]);

  const handlePreviewVideo = (item: { video: SampleVideo; resolution: SampleVideoResolution }) => {
    if (item.resolution.url.startsWith('canvas:')) {
      Alert.alert(
        'Canvas Video',
        `"${item.video.name}" is a generated test pattern that will be rendered in real-time at ${item.resolution.width}x${item.resolution.height}. No preview available - apply directly to test.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Apply Now', onPress: () => handleQuickApplySample(item) }
        ]
      );
      return;
    }
    setPreviewVideo(item);
    setVideoLoading(true);
    console.log('[DevicesList] Previewing video:', item.video.name);
  };

  if (!activeTemplate) {
    return (
      <View style={styles.noTemplateCard}>
        <Smartphone size={32} color="rgba(255,255,255,0.3)" />
        <Text style={styles.noTemplateText}>No device template selected</Text>
        <TouchableOpacity style={styles.setupBtn} onPress={onDeviceCheckPress}>
          <Text style={styles.setupBtnText}>Run Camera Check</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const backCameras = activeTemplate.captureDevices.filter(d => d.facing === 'back');
  const frontCameras = activeTemplate.captureDevices.filter(d => d.facing === 'front');

  return (
    <ScrollView 
      style={styles.devicesList} 
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
    >
      <TouchableOpacity style={styles.templateHeader} onPress={onTemplateHeaderPress}>
        <View style={styles.templateHeaderInfo}>
          <Text style={styles.templateHeaderName}>{activeTemplate.name}</Text>
          <Text style={styles.templateHeaderMeta}>
            {activeTemplate.captureDevices.length} cameras ({backCameras.length} rear, {frontCameras.length} front)
          </Text>
        </View>
        <TouchableOpacity style={styles.templateInfoBtn} onPress={() => setShowTemplateInfo(true)}>
          <Info size={16} color="#00aaff" />
        </TouchableOpacity>
        <ChevronRight size={18} color="rgba(255,255,255,0.5)" />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.permissionToggle, stealthMode && styles.stealthToggleActive]}
        onPress={onStealthModeToggle}
      >
        <View style={styles.permissionIcon}>
          <Camera size={16} color={stealthMode ? '#0a0a0a' : '#ff6b35'} />
        </View>
        <View style={styles.permissionTextContainer}>
          <Text style={[styles.permissionLabel, stealthMode && styles.stealthLabelActive]}>Stealth Mode</Text>
          <Text style={[styles.permissionHint, stealthMode && styles.stealthHintActive]}>
            {stealthMode ? 'Only simulated feeds accessible' : 'Real cameras accessible'}
          </Text>
        </View>
        <View style={[styles.toggleIndicator, stealthMode && styles.stealthIndicatorActive]} />
      </TouchableOpacity>

      

      <View style={styles.applyToAllSection}>
        <View style={styles.applyToAllHeader}>
          <View style={styles.applyToAllHeaderLeft}>
            <Zap size={14} color="#00ff88" />
            <Text style={styles.applyToAllLabel}>Quick Video Setup</Text>
          </View>
          <TouchableOpacity style={styles.sampleUrlsToggle} onPress={() => setShowSampleUrls(!showSampleUrls)}>
            <Text style={styles.sampleUrlsToggleText}>{showSampleUrls ? 'Hide Samples' : 'Sample Videos'}</Text>
          </TouchableOpacity>
        </View>
        
        {showSampleUrls && (
          <View style={styles.sampleUrlsList}>
            <View style={styles.resolutionMatchBanner}>
              <Film size={12} color="#00aaff" />
              <Text style={styles.resolutionMatchText}>
                Matched to {getResolutionLabel(detectedResolution.width, detectedResolution.height)} @ {detectedResolution.fps}fps
              </Text>
            </View>
            {matchedSampleVideos.slice(0, 4).map((item) => (
              <TouchableOpacity key={item.video.id} style={styles.sampleUrlItem} onPress={() => handleQuickApplySample(item)}>
                <View style={styles.sampleUrlInfo}>
                  <View style={styles.sampleTitleRow}>
                    <Text style={styles.sampleUrlName}>{item.video.name}</Text>
                    {item.video.isLooping && <Repeat size={10} color="#00ff88" />}
                  </View>
                  <Text style={styles.sampleUrlDesc}>{item.resolution.label}</Text>
                </View>
                <TouchableOpacity style={styles.previewBtn} onPress={() => handlePreviewVideo(item)}>
                  <Play size={12} color="#00aaff" />
                </TouchableOpacity>
                <View style={styles.sampleApplyBtn}>
                  <Copy size={12} color="#0a0a0a" />
                  <Text style={styles.sampleApplyText}>All</Text>
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.viewAllBtn} onPress={() => setShowVideoLibrary(true)}>
              <Text style={styles.viewAllBtnText}>View All {SAMPLE_VIDEOS.length} Videos</Text>
              <ChevronRight size={14} color="#00ff88" />
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.applyToAllRow}>
          <TextInput
            style={styles.applyToAllInput}
            value={applyToAllUrl}
            onChangeText={setApplyToAllUrl}
            placeholder="Paste direct video URL (.mp4, .mov)..."
            placeholderTextColor="rgba(255,255,255,0.3)"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        
        <View style={styles.urlActionsRow}>
          <TouchableOpacity
            style={[styles.urlActionBtn, styles.downloadBtn, !applyToAllUrl.trim() && styles.urlActionBtnDisabled]}
            onPress={handleDownloadAndSave}
            disabled={!applyToAllUrl.trim() || processingState.isProcessing}
          >
            <Download size={14} color={applyToAllUrl.trim() ? '#ffffff' : 'rgba(255,255,255,0.4)'} />
            <Text style={[styles.urlActionBtnText, styles.downloadBtnText, !applyToAllUrl.trim() && styles.urlActionBtnTextDisabled]}>
              {Platform.OS === 'web' ? 'Add to My Videos' : 'Download & Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.uploadActionsRow}>
          <TouchableOpacity
            style={styles.uploadBtn}
            onPress={onPickVideoForAll}
          >
            <Upload size={14} color="#00ff88" />
            <Text style={styles.uploadBtnText}>Upload Video</Text>
          </TouchableOpacity>
          
          {Platform.OS !== 'web' && savedVideos.length > 0 && (
            <TouchableOpacity
              style={styles.myVideosBtn}
              onPress={handleOpenMyVideos}
            >
              <FolderOpen size={14} color="#00aaff" />
              <Text style={styles.myVideosBtnText}>My Videos ({savedVideos.length})</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <Text style={styles.applyToAllHint}>
          Videos must be saved to My Videos and pass compatibility check before use
        </Text>
      </View>

      {activeTemplate.captureDevices.map((device) => (
        <DeviceCard
          key={device.id}
          device={device}
          isSelected={selectedDeviceId === device.id}
          videoSourceType={videoSourceType}
          videoUrlInput={videoUrlInput}
          onSelect={() => setSelectedDeviceId(device.id)}
          onCancel={() => setSelectedDeviceId(null)}
          onSourceTypeChange={setVideoSourceType}
          onUrlChange={setVideoUrlInput}
          onApplyUrl={() => handleApplyUrl(device.id)}
          onPickVideo={() => onPickVideo(device.id)}
          onToggleSimulation={() => onToggleDeviceSimulation(device.id)}
          onClearVideo={() => onClearDeviceVideo(device.id)}
          onShowInfo={() => setSelectedCameraInfo(device)}
        />
      ))}

      <TemplateInfoModal
        visible={showTemplateInfo}
        template={activeTemplate}
        onClose={() => setShowTemplateInfo(false)}
      />

      <CameraInfoModal
        visible={selectedCameraInfo !== null}
        camera={selectedCameraInfo}
        onClose={() => setSelectedCameraInfo(null)}
      />

      <VideoLibraryModal
        visible={showVideoLibrary}
        videos={matchedSampleVideos}
        detectedResolution={detectedResolution}
        onClose={() => setShowVideoLibrary(false)}
        onSelect={handleQuickApplySample}
        onPreview={handlePreviewVideo}
      />

      <VideoPreviewModal
        visible={previewVideo !== null}
        videoItem={previewVideo}
        isLoading={videoLoading}
        onLoadStart={() => setVideoLoading(true)}
        onLoad={() => setVideoLoading(false)}
        onClose={() => {
          setPreviewVideo(null);
          setVideoLoading(false);
        }}
        onApply={() => {
          if (previewVideo) {
            handleQuickApplySample(previewVideo);
            setPreviewVideo(null);
          }
        }}
      />

      <VideoValidationModal
        visible={showValidationModal}
        isValidating={isValidating}
        validationResult={validationResult}
        videoUrl={pendingVideoUrl}
        onClose={() => {
          setShowValidationModal(false);
          setValidationResult(null);
          setPendingVideoUrl('');
          setPendingDeviceId(null);
          setPendingApplyToAll(false);
        }}
        onRetry={() => {
          setShowValidationModal(false);
          if (pendingVideoUrl) {
            validateAndApplyVideo(pendingVideoUrl, pendingDeviceId, pendingApplyToAll);
          }
        }}
      />

      <RestartRequiredModal
        visible={showRestartModal}
        onRestart={() => {
          setShowRestartModal(false);
          onRestartRequired?.();
        }}
      />

      <CompatibilityCheckModal
        visible={compatibilityModalVisible}
        onClose={() => {
          setCompatibilityModalVisible(false);
          setPendingSavedVideo(null);
          setPendingApplyTarget(null);
        }}
        result={compatibilityResult}
        isChecking={isCheckingCompatibility}
        videoName={checkingVideoName}
        onApply={compatibilityResult?.readyForSimulation ? handleApplyCompatibleVideo : undefined}
      />

      <PlaybackTestModal
        visible={showPlaybackTest}
        status={playbackTestStatus}
        error={playbackTestError}
        videoUrl={playbackTestUrl}
        onClose={() => {
          setShowPlaybackTest(false);
          setPlaybackTestStatus('testing');
          setPlaybackTestError(null);
        }}
        onRetry={() => {
          if (playbackTestUrl) {
            applyValidatedVideo(playbackTestUrl, pendingDeviceId, pendingApplyToAll);
          }
        }}
      />

      <Modal
        visible={processingState.isProcessing || processingState.stage === 'complete' || processingState.stage === 'error'}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!processingState.isProcessing) {
            clearProcessingState();
          }
        }}
      >
        <View style={styles.processingOverlay}>
          <View style={styles.processingCard}>
            {processingState.stage === 'error' ? (
              <>
                <View style={styles.processingIconError}>
                  <XCircle size={32} color="#ff4444" />
                </View>
                <Text style={styles.processingTitle}>Download Failed</Text>
                <Text style={styles.processingError}>{processingState.error}</Text>
                <TouchableOpacity
                  style={styles.processingCloseBtn}
                  onPress={clearProcessingState}
                >
                  <Text style={styles.processingCloseBtnText}>Close</Text>
                </TouchableOpacity>
              </>
            ) : processingState.stage === 'complete' ? (
              <>
                <View style={styles.processingIconSuccess}>
                  <CheckCircle size={32} color="#00ff88" />
                </View>
                <Text style={styles.processingTitle}>Video Saved!</Text>
                <Text style={styles.processingMessage}>Video is ready for simulation</Text>
              </>
            ) : (
              <>
                <ActivityIndicator size="large" color="#00aaff" />
                <Text style={styles.processingTitle}>{processingState.message}</Text>
                {processingState.progress > 0 && (
                  <View style={styles.progressBarContainer}>
                    <View style={[styles.progressBar, { width: `${processingState.progress}%` }]} />
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  devicesList: {
    maxHeight: 380,
  },
  noTemplateCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 24,
    gap: 12,
  },
  noTemplateText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
  setupBtn: {
    backgroundColor: '#00ff88',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  setupBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#0a0a0a',
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,255,136,0.08)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,255,136,0.2)',
  },
  templateHeaderInfo: {
    flex: 1,
  },
  templateHeaderName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  templateHeaderMeta: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  templateInfoBtn: {
    padding: 8,
    marginRight: 4,
  },
  permissionToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.2)',
    marginBottom: 12,
  },
  permissionToggleActive: {
    backgroundColor: '#00ff88',
    borderColor: '#00ff88',
  },
  permissionIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  permissionTextContainer: {
    flex: 1,
  },
  permissionLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  permissionLabelActive: {
    color: '#0a0a0a',
  },
  permissionHint: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 1,
  },
  toggleIndicator: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: 'rgba(0, 255, 136, 0.5)',
  },
  toggleIndicatorActive: {
    backgroundColor: '#0a0a0a',
    borderColor: '#0a0a0a',
  },
  stealthToggleActive: {
    backgroundColor: '#ff6b35',
    borderColor: '#ff6b35',
  },
  stealthLabelActive: {
    color: '#0a0a0a',
  },
  stealthHintActive: {
    color: 'rgba(0,0,0,0.6)',
  },
  stealthIndicatorActive: {
    backgroundColor: '#0a0a0a',
    borderColor: '#0a0a0a',
  },
  applyToAllSection: {
    backgroundColor: 'rgba(0,255,136,0.05)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,255,136,0.25)',
  },
  applyToAllHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  applyToAllHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  applyToAllLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  sampleUrlsToggle: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  sampleUrlsToggleText: {
    fontSize: 10,
    color: '#00ff88',
    fontWeight: '600' as const,
  },
  sampleUrlsList: {
    marginBottom: 10,
    gap: 6,
  },
  resolutionMatchBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,170,255,0.1)',
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
  },
  resolutionMatchText: {
    fontSize: 11,
    color: '#00aaff',
    fontWeight: '500' as const,
  },
  sampleUrlItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  sampleUrlInfo: {
    flex: 1,
  },
  sampleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sampleUrlName: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  sampleUrlDesc: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  previewBtn: {
    padding: 8,
    marginRight: 6,
  },
  sampleApplyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#00ff88',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  sampleApplyText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#0a0a0a',
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(0,255,136,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0,255,136,0.25)',
  },
  viewAllBtnText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#00ff88',
  },
  applyToAllRow: {
    flexDirection: 'row',
    gap: 6,
  },
  applyToAllInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#ffffff',
  },
  applyToAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#00ff88',
    borderRadius: 8,
    paddingHorizontal: 14,
  },
  applyToAllBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  applyToAllBtnText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#0a0a0a',
  },
  applyToAllBtnTextDisabled: {
    color: 'rgba(255,255,255,0.4)',
  },
  applyToAllHint: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 6,
    textAlign: 'center' as const,
  },
  urlActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  urlActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#00ff88',
    borderRadius: 8,
    paddingVertical: 10,
  },
  urlActionBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  urlActionBtnText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#0a0a0a',
  },
  urlActionBtnTextDisabled: {
    color: 'rgba(255,255,255,0.4)',
  },
  downloadBtn: {
    backgroundColor: '#00aaff',
  },
  downloadBtnText: {
    color: '#ffffff',
  },
  uploadActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  uploadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,255,136,0.1)',
    borderRadius: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,255,136,0.3)',
    borderStyle: 'dashed',
  },
  uploadBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#00ff88',
  },
  myVideosBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,170,255,0.1)',
    borderRadius: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,170,255,0.3)',
  },
  myVideosBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#00aaff',
  },
  processingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  processingCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 300,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  processingTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#ffffff',
    marginTop: 16,
    textAlign: 'center' as const,
  },
  processingMessage: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 8,
    textAlign: 'center' as const,
  },
  processingError: {
    fontSize: 13,
    color: '#ff6b6b',
    marginTop: 8,
    textAlign: 'center' as const,
    lineHeight: 18,
  },
  processingIconSuccess: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0,255,136,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingIconError: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,68,68,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingCloseBtn: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
  },
  processingCloseBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  progressBarContainer: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#00aaff',
    borderRadius: 2,
  },
});
