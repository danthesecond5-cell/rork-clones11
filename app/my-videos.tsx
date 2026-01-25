import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { ChevronLeft, Grid3X3, List, Download, Upload } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useVideoSelection } from '@/hooks/useVideoSelection';
import { useVideoLibrary } from '@/contexts/VideoLibraryContext';
import ImportProgressModal, { ImportProgress } from '@/components/browser/modals/ImportProgressModal';
import { isKnownCorsBlockingSite } from '@/utils/videoServing';
import { CompatibilityCheckModal } from '@/components/browser/modals';
import {
  VideoGridItem,
  VideoListItem,
  VideosHeader,
  EmptyVideosState,
  VideoListFooter,
  styles,
  GRID_COLUMNS,
} from '@/components/my-videos';
import type { SavedVideo } from '@/utils/videoManager';

type ViewMode = 'grid' | 'list';

export default function MyVideosScreen() {
  const {
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
  } = useVideoSelection();

  const {
    downloadAndSaveVideo,
    saveLocalVideo,
    processingState,
    clearProcessingState,
  } = useVideoLibrary();

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [importUrl, setImportUrl] = useState('');
  const [importingVideoName, setImportingVideoName] = useState('');

  useEffect(() => {
    if (processingState.stage === 'error' && !processingState.isProcessing) {
      Alert.alert('Import Failed', processingState.error || 'Unable to import video.');
      clearProcessingState();
    }
  }, [processingState, clearProcessingState]);

  const executeDownload = useCallback(async (url: string) => {
    const result = await downloadAndSaveVideo(url);
    if (!result) return;

    setImportUrl('');
    Keyboard.dismiss();

    setTimeout(() => {
      clearProcessingState();
    }, 500);

    handleCheckCompatibility(result);
  }, [downloadAndSaveVideo, clearProcessingState, handleCheckCompatibility]);

  const handleDownloadAndSave = useCallback(async () => {
    if (!importUrl.trim()) return;

    const url = importUrl.trim();

    if (isKnownCorsBlockingSite(url)) {
      Alert.alert(
        'Download Recommended',
        'This video source often blocks direct playback. The video will be downloaded to your device for reliable simulation.',
        [{ text: 'Continue', onPress: async () => await executeDownload(url) }]
      );
      return;
    }

    await executeDownload(url);
  }, [importUrl, executeDownload]);

  const handlePickFromPhotos = useCallback(async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please grant media library access to upload files.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const media = result.assets[0];
        const mediaUri = media.uri;
        const isVideo = media.type === 'video';
        const defaultExt = isVideo ? 'mp4' : 'jpg';
        const fileName = media.fileName || mediaUri.split('/').pop() || `uploaded_file.${defaultExt}`;

        setImportingVideoName(fileName);
        const savedVideo = await saveLocalVideo(mediaUri, fileName);

        setImportingVideoName('');
        clearProcessingState();

        if (!savedVideo) {
          Alert.alert('Error', 'Failed to save video to library. Please try again.');
          return;
        }

        handleCheckCompatibility(savedVideo);
      }
    } catch (error) {
      console.error('[MyVideos] Error picking file from photos:', error);
      Alert.alert('Error', 'Failed to pick file. Please try again.');
    }
  }, [saveLocalVideo, clearProcessingState, handleCheckCompatibility]);

  const handlePickFromFiles = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['video/*', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        const fileUri = file.uri;
        const fileName = file.name || fileUri.split('/').pop() || 'uploaded_file';

        setImportingVideoName(fileName);
        const savedVideo = await saveLocalVideo(fileUri, fileName);

        setImportingVideoName('');
        clearProcessingState();

        if (!savedVideo) {
          Alert.alert('Error', 'Failed to save video to library. Please try again.');
          return;
        }

        handleCheckCompatibility(savedVideo);
      }
    } catch (error) {
      console.error('[MyVideos] Error picking file from files:', error);
      Alert.alert('Error', 'Failed to pick file. Please try again.');
    }
  }, [saveLocalVideo, clearProcessingState, handleCheckCompatibility]);

  const filteredVideos = useMemo(() => {
    if (!searchQuery.trim()) return savedVideos;
    const query = searchQuery.toLowerCase();
    return savedVideos.filter(v => 
      v.name.toLowerCase().includes(query) ||
      v.originalName.toLowerCase().includes(query)
    );
  }, [savedVideos, searchQuery]);

  const renderGridItem = useCallback(({ item: video }: { item: SavedVideo }) => (
    <VideoGridItem
      video={video}
      isSelected={selectedVideoId === video.id}
      isRegenerating={regeneratingId === video.id}
      onSelect={() => toggleVideoSelection(video.id)}
      onUse={() => handleSelectVideo(video)}
      onCheck={() => handleCheckCompatibility(video)}
      onRegenerate={() => handleRegenerateThumbnail(video.id)}
      onDelete={() => handleDeleteVideo(video.id, video.name)}
    />
  ), [selectedVideoId, regeneratingId, toggleVideoSelection, handleSelectVideo, handleCheckCompatibility, handleRegenerateThumbnail, handleDeleteVideo]);

  const renderListItem = useCallback(({ item: video }: { item: SavedVideo }) => (
    <VideoListItem
      video={video}
      isSelected={selectedVideoId === video.id}
      onSelect={() => toggleVideoSelection(video.id)}
      onUse={() => handleSelectVideo(video)}
      onCheck={() => handleCheckCompatibility(video)}
      onDelete={() => handleDeleteVideo(video.id, video.name)}
    />
  ), [selectedVideoId, toggleVideoSelection, handleSelectVideo, handleCheckCompatibility, handleDeleteVideo]);

  const keyExtractor = useCallback((item: SavedVideo) => item.id, []);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: 'My Videos',
            headerStyle: { backgroundColor: '#0a0a0a' },
            headerTintColor: '#ffffff',
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00ff88" />
          <Text style={styles.loadingText}>Loading videos...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'My Videos',
          headerStyle: { backgroundColor: '#0a0a0a' },
          headerTintColor: '#ffffff',
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => {
                Keyboard.dismiss();
                requestAnimationFrame(() => {
                  router.back();
                });
              }}
              style={styles.headerButton}
            >
              <ChevronLeft size={24} color="#00ff88" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={styles.headerRight}>
              <TouchableOpacity
                style={[styles.viewModeBtn, viewMode === 'grid' && styles.viewModeBtnActive]}
                onPress={() => setViewMode('grid')}
              >
                <Grid3X3 size={18} color={viewMode === 'grid' ? '#00ff88' : 'rgba(255,255,255,0.5)'} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.viewModeBtn, viewMode === 'list' && styles.viewModeBtnActive]}
                onPress={() => setViewMode('list')}
              >
                <List size={18} color={viewMode === 'list' ? '#00ff88' : 'rgba(255,255,255,0.5)'} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <KeyboardAvoidingView 
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <VideosHeader
            videoCount={filteredVideos.length}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          <View style={styles.importSection}>
            <View style={styles.importHeader}>
              <Download size={16} color="#00aaff" />
              <Text style={styles.importTitle}>Import Videos</Text>
            </View>
            <View style={styles.importRow}>
              <TextInput
                style={styles.importInput}
                value={importUrl}
                onChangeText={setImportUrl}
                placeholder="Paste direct video URL (.mp4, .mov)..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
              <TouchableOpacity
                style={[
                  styles.importButton,
                  (!importUrl.trim() || processingState.isProcessing) && styles.importButtonDisabled,
                ]}
                onPress={handleDownloadAndSave}
                disabled={!importUrl.trim() || processingState.isProcessing}
              >
                <Download size={14} color={importUrl.trim() ? '#ffffff' : 'rgba(255,255,255,0.4)'} />
                <Text
                  style={[
                    styles.importButtonText,
                    (!importUrl.trim() || processingState.isProcessing) && styles.importButtonTextDisabled,
                  ]}
                >
                  {Platform.OS === 'web' ? 'Add URL' : 'Import URL'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.importActionsRow}>
              {Platform.OS === 'web' ? (
                <TouchableOpacity
                  style={[
                    styles.importActionButton,
                    processingState.isProcessing && styles.importActionButtonDisabled,
                  ]}
                  onPress={handlePickFromFiles}
                  disabled={processingState.isProcessing}
                >
                  <Upload size={14} color="#00ff88" />
                  <Text style={styles.importActionButtonText}>Upload Video</Text>
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity
                    style={[
                      styles.importActionButton,
                      processingState.isProcessing && styles.importActionButtonDisabled,
                    ]}
                    onPress={handlePickFromPhotos}
                    disabled={processingState.isProcessing}
                  >
                    <Upload size={14} color="#00ff88" />
                    <Text style={styles.importActionButtonText}>Photos</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.importActionButton,
                      processingState.isProcessing && styles.importActionButtonDisabled,
                    ]}
                    onPress={handlePickFromFiles}
                    disabled={processingState.isProcessing}
                  >
                    <Upload size={14} color="#00ff88" />
                    <Text style={styles.importActionButtonText}>Files</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
            <Text style={styles.importHint}>
              Imported videos are compatibility checked before they appear in injection dropdowns.
            </Text>
          </View>

          {filteredVideos.length === 0 ? (
            <EmptyVideosState searchQuery={searchQuery} />
          ) : viewMode === 'grid' ? (
            <FlatList
              testID="videos-grid-list"
              data={filteredVideos}
              key={`grid-${GRID_COLUMNS}`}
              numColumns={GRID_COLUMNS}
              keyExtractor={keyExtractor}
              renderItem={renderGridItem}
              ListFooterComponent={VideoListFooter}
              contentContainerStyle={styles.gridContent}
              columnWrapperStyle={styles.gridWrapper}
              showsVerticalScrollIndicator={false}
              initialNumToRender={8}
              maxToRenderPerBatch={8}
              updateCellsBatchingPeriod={16}
              windowSize={5}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              removeClippedSubviews={Platform.OS === 'android'}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={handleRefresh}
                  tintColor="#00ff88"
                  colors={['#00ff88']}
                />
              }
            />
          ) : (
            <FlatList
              testID="videos-list"
              data={filteredVideos}
              key="list"
              keyExtractor={keyExtractor}
              renderItem={renderListItem}
              ListFooterComponent={VideoListFooter}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              initialNumToRender={10}
              maxToRenderPerBatch={10}
              updateCellsBatchingPeriod={16}
              windowSize={7}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              removeClippedSubviews={Platform.OS === 'android'}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={handleRefresh}
                  tintColor="#00ff88"
                  colors={['#00ff88']}
                />
              }
            />
          )}
        </KeyboardAvoidingView>
        
        <CompatibilityCheckModal
          visible={compatibilityModalVisible}
          onClose={closeCompatibilityModal}
          result={compatibilityResult}
          isChecking={isCheckingCompatibility}
          videoName={checkingVideoName}
        />

        <ImportProgressModal
          visible={processingState.isProcessing && processingState.stage !== 'complete'}
          progress={{
            progress: processingState.progress,
            stage: processingState.stage as ImportProgress['stage'],
            message: processingState.message,
          }}
          videoName={importingVideoName}
        />
      </SafeAreaView>
    </View>
  );
}
