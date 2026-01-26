import { Platform } from 'react-native';
import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import {
  ensureVideosDirectory,
  extractVideoMetadataFromUri,
  generateThumbnail,
  getVideosDirectoryUri,
  type SavedVideo,
  type VideoMetadata,
  type VideoCompatibilitySummary,
} from '@/utils/videoManager';

export const SAMPLE_VIDEO_ASSET = require('../assets/videos/sample-loop.mp4');
export const SAMPLE_VIDEO_ID = 'video_sample_loop_1s';
export const SAMPLE_VIDEO_NAME = 'Sample Loop (1s)';
export const SAMPLE_VIDEO_ORIGINAL_NAME = 'sample-loop.mp4';
export const SAMPLE_VIDEO_SOURCE = 'app://sample-loop';

const SAMPLE_METADATA: VideoMetadata = {
  duration: 1,
  width: 1080,
  height: 1920,
  orientation: 'portrait',
  aspectRatio: '9:16',
  isVertical: true,
};

const SAMPLE_COMPATIBILITY: VideoCompatibilitySummary = {
  overallStatus: 'perfect',
  score: 100,
  readyForSimulation: true,
  checkedAt: new Date().toISOString(),
};

export const isBundledSampleVideo = (video?: SavedVideo | null): boolean => {
  if (!video) return false;
  return video.id === SAMPLE_VIDEO_ID || video.sourceUrl === SAMPLE_VIDEO_SOURCE;
};

const resolveBundledAssetUri = async (): Promise<string | null> => {
  try {
    const asset = Asset.fromModule(SAMPLE_VIDEO_ASSET);
    await asset.downloadAsync();
    return asset.localUri || asset.uri || null;
  } catch (error) {
    console.warn('[SampleVideo] Failed to resolve bundled asset URI:', error);
    return null;
  }
};

const buildSampleVideoEntry = async (
  uri: string,
  existing?: SavedVideo | null
): Promise<SavedVideo> => {
  const fileSize = existing?.fileSize ?? 0;
  const metadata = existing?.metadata || SAMPLE_METADATA;
  const compatibility = existing?.compatibility || {
    ...SAMPLE_COMPATIBILITY,
    checkedAt: new Date().toISOString(),
  };
  const createdAt = existing?.createdAt || new Date().toISOString();

  return {
    id: SAMPLE_VIDEO_ID,
    name: SAMPLE_VIDEO_NAME,
    originalName: SAMPLE_VIDEO_ORIGINAL_NAME,
    uri,
    sourceType: 'local',
    sourceUrl: SAMPLE_VIDEO_SOURCE,
    fileSize,
    createdAt,
    thumbnailUri: existing?.thumbnailUri,
    metadata,
    compatibility,
  };
};

export const ensureBundledSampleVideo = async (
  existing?: SavedVideo | null
): Promise<SavedVideo | null> => {
  if (Platform.OS === 'web') {
    const webUri = (Asset.fromModule(SAMPLE_VIDEO_ASSET).uri || '').trim();
    if (!webUri) return null;
    return buildSampleVideoEntry(webUri, existing);
  }

  try {
    ensureVideosDirectory();

    const assetUri = await resolveBundledAssetUri();
    if (!assetUri) return null;

    const destinationUri = `${getVideosDirectoryUri()}/${SAMPLE_VIDEO_ORIGINAL_NAME}`;
    const destinationFile = new File(destinationUri);

    if (!destinationFile.exists) {
      const sourceFile = new File(assetUri);
      if (sourceFile.exists) {
        sourceFile.copy(destinationFile);
      } else {
        console.warn('[SampleVideo] Bundled video source missing:', assetUri);
        return null;
      }
    }

    const info = destinationFile.info();
    const fileSize = info.size || existing?.fileSize || 0;
    const metadata = existing?.metadata || await extractVideoMetadataFromUri(destinationUri);
    const thumbnailUri = existing?.thumbnailUri || await generateThumbnail(destinationUri, SAMPLE_VIDEO_ID);
    const compatibility = existing?.compatibility || {
      ...SAMPLE_COMPATIBILITY,
      checkedAt: new Date().toISOString(),
    };
    const createdAt = existing?.createdAt || new Date().toISOString();

    return {
      id: SAMPLE_VIDEO_ID,
      name: SAMPLE_VIDEO_NAME,
      originalName: SAMPLE_VIDEO_ORIGINAL_NAME,
      uri: destinationUri,
      sourceType: 'local',
      sourceUrl: SAMPLE_VIDEO_SOURCE,
      fileSize,
      createdAt,
      thumbnailUri: thumbnailUri || undefined,
      metadata,
      compatibility,
    };
  } catch (error) {
    console.error('[SampleVideo] Failed to ensure bundled sample video:', error);
    return null;
  }
};
