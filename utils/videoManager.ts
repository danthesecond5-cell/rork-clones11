import { Platform, Image } from 'react-native';
import { File, Directory, Paths } from 'expo-file-system';
import * as Crypto from 'expo-crypto';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { Audio } from 'expo-av';

export interface VideoMetadata {
  duration?: number;
  width?: number;
  height?: number;
  orientation: 'portrait' | 'landscape' | 'square';
  aspectRatio: string;
  isVertical: boolean;
}

export interface VideoCompatibilitySummary {
  overallStatus: 'perfect' | 'compatible' | 'warning' | 'incompatible';
  score: number;
  readyForSimulation: boolean;
  checkedAt: string;
}

export interface SavedVideo {
  id: string;
  name: string;
  originalName: string;
  uri: string;
  sourceType: 'local' | 'url';
  sourceUrl?: string;
  fileSize: number;
  createdAt: string;
  thumbnailUri?: string;
  metadata?: VideoMetadata;
  compatibility?: VideoCompatibilitySummary;
}

export interface DownloadProgress {
  bytesWritten: number;
  totalBytes: number;
  progress: number;
  stage: 'downloading' | 'processing' | 'generating_thumbnail' | 'complete';
}

export interface VideoProcessingResult {
  success: boolean;
  video?: SavedVideo;
  error?: string;
}

const VIDEOS_FOLDER_NAME = 'saved_videos';
const THUMBNAILS_FOLDER_NAME = 'video_thumbnails';

const getVideosDirectory = (): Directory => {
  return new Directory(Paths.document, VIDEOS_FOLDER_NAME);
};

const getThumbnailsDirectory = (): Directory => {
  return new Directory(Paths.document, THUMBNAILS_FOLDER_NAME);
};

export const ensureVideosDirectory = (): void => {
  try {
    const videosDir = getVideosDirectory();
    if (!videosDir.exists) {
      videosDir.create({ intermediates: true });
      console.log('[VideoManager] Created videos directory:', videosDir.uri);
    }
    
    const thumbsDir = getThumbnailsDirectory();
    if (!thumbsDir.exists) {
      thumbsDir.create({ intermediates: true });
      console.log('[VideoManager] Created thumbnails directory:', thumbsDir.uri);
    }
  } catch (error) {
    console.error('[VideoManager] Failed to create directories:', error);
  }
};

export const generateVideoId = async (): Promise<string> => {
  const randomBytes = await Crypto.getRandomBytesAsync(8);
  const hex = Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return `video_${Date.now()}_${hex}`;
};

export const getVideoExtension = (url: string, fallback: string = 'mp4'): string => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();
    const parts = pathname.split('.');
    if (parts.length > 1) {
      const ext = parts.pop();
      if (ext && ['mp4', 'mov', 'webm', 'm4v', 'avi', 'mkv', '3gp'].includes(ext)) {
        return ext;
      }
    }
  } catch {
    const parts = url.split('.');
    if (parts.length > 1) {
      const ext = parts.pop()?.toLowerCase()?.split('?')[0];
      if (ext && ['mp4', 'mov', 'webm', 'm4v', 'avi', 'mkv', '3gp'].includes(ext)) {
        return ext;
      }
    }
  }
  return fallback;
};

export const formatDateForFilename = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const mins = String(now.getMinutes()).padStart(2, '0');
  const secs = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}_${hours}${mins}${secs}`;
};

export const isDirectVideoUrl = (url: string): boolean => {
  const blockedDomains = [
    'youtube.com', 'youtu.be', 'tiktok.com', 'instagram.com',
    'twitter.com', 'x.com', 'facebook.com', 'vimeo.com',
    'dailymotion.com', 'twitch.tv'
  ];
  
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    for (const domain of blockedDomains) {
      if (hostname.includes(domain)) {
        return false;
      }
    }
    
    return true;
  } catch {
    return false;
  }
};

export const generateThumbnail = async (videoUri: string, videoId: string): Promise<string | null> => {
  if (Platform.OS === 'web') {
    console.log('[VideoManager] Thumbnail generation not supported on web');
    return null;
  }

  try {
    console.log('[VideoManager] Generating thumbnail for:', videoUri);
    
    const { uri: thumbnailUri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
      time: 1000,
      quality: 0.7,
    });
    
    console.log('[VideoManager] Thumbnail generated at:', thumbnailUri);
    
    const thumbsDir = getThumbnailsDirectory();
    const thumbnailFileName = `thumb_${videoId}.jpg`;
    const destinationFile = new File(thumbsDir, thumbnailFileName);
    
    // Delete existing thumbnail if it exists to avoid copy conflicts
    if (destinationFile.exists) {
      try {
        destinationFile.delete();
        console.log('[VideoManager] Deleted existing thumbnail:', destinationFile.uri);
      } catch (deleteError) {
        console.warn('[VideoManager] Could not delete existing thumbnail:', deleteError);
      }
    }
    
    const sourceFile = new File(thumbnailUri);
    if (sourceFile.exists) {
      sourceFile.copy(destinationFile);
      console.log('[VideoManager] Thumbnail saved to:', destinationFile.uri);
      return destinationFile.uri;
    }
    
    return thumbnailUri;
  } catch (error) {
    console.error('[VideoManager] Thumbnail generation failed:', error);
    return null;
  }
};

export const extractVideoMetadata = (width?: number, height?: number, duration?: number): VideoMetadata => {
  const w = width || 0;
  const h = height || 0;
  
  let orientation: 'portrait' | 'landscape' | 'square' = 'landscape';
  if (w > 0 && h > 0) {
    if (h > w) {
      orientation = 'portrait';
    } else if (w === h) {
      orientation = 'square';
    }
  }
  
  let aspectRatio = 'unknown';
  if (w > 0 && h > 0) {
    const ratio = w / h;
    // Use 0.05 tolerance for precise aspect ratio detection (matches videoCompatibilityChecker)
    if (Math.abs(ratio - 9/16) < 0.05) aspectRatio = '9:16';
    else if (Math.abs(ratio - 16/9) < 0.05) aspectRatio = '16:9';
    else if (Math.abs(ratio - 4/3) < 0.05) aspectRatio = '4:3';
    else if (Math.abs(ratio - 3/4) < 0.05) aspectRatio = '3:4';
    else if (Math.abs(ratio - 1) < 0.05) aspectRatio = '1:1';
    else {
      // Calculate simplified ratio for non-standard aspect ratios
      const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
      const divisor = gcd(w, h);
      aspectRatio = `${w / divisor}:${h / divisor}`;
    }
  }
  
  console.log('[VideoManager] Extracted metadata - dimensions:', w, 'x', h, 'ratio:', aspectRatio, 'orientation:', orientation);
  
  return {
    duration,
    width: w,
    height: h,
    orientation,
    aspectRatio,
    isVertical: orientation === 'portrait',
  };
};

export const extractVideoMetadataFromUri = async (
  uri: string,
  onProgress?: (progress: number, message: string) => void
): Promise<VideoMetadata> => {
  console.log('[VideoManager] Extracting metadata from URI:', uri);
  
  onProgress?.(0.1, 'Loading video...');
  
  if (Platform.OS === 'web') {
    return new Promise((resolve) => {
      if (typeof document === 'undefined') {
        resolve(extractVideoMetadata());
        return;
      }
      
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      
      const timeout = setTimeout(() => {
        console.warn('[VideoManager] Metadata extraction timed out');
        video.src = '';
        video.remove();
        resolve(extractVideoMetadata());
      }, 15000);
      
      video.onloadedmetadata = () => {
        clearTimeout(timeout);
        onProgress?.(0.8, 'Analyzing dimensions...');
        
        const width = video.videoWidth;
        const height = video.videoHeight;
        const duration = video.duration;
        
        console.log('[VideoManager] Metadata extracted:', { width, height, duration });
        
        video.src = '';
        video.remove();
        
        onProgress?.(1.0, 'Complete');
        resolve(extractVideoMetadata(width, height, duration));
      };
      
      video.onerror = () => {
        clearTimeout(timeout);
        console.warn('[VideoManager] Failed to extract metadata from video');
        video.src = '';
        video.remove();
        resolve(extractVideoMetadata());
      };
      
      video.src = uri;
    });
  }
  
  // Native platform - use expo-av Audio to get duration and thumbnail for dimensions
  return new Promise(async (resolve) => {
    let duration: number | undefined;
    let width = 0;
    let height = 0;
    
    try {
      onProgress?.(0.2, 'Loading video info...');
      
      // Try to get duration using expo-av Audio.Sound
      // Note: Audio.Sound can load video files on iOS/Android and extract duration
      console.log('[VideoManager] Loading video with expo-av Audio to get duration...');
      
      try {
        // Configure audio mode for video playback
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: false,
        });
        
        const { sound, status } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: false, volume: 0 },
          undefined,
          true // downloadFirst for better reliability
        );
        
        if (status.isLoaded) {
          if (status.durationMillis && status.durationMillis > 0) {
            duration = status.durationMillis / 1000;
            console.log('[VideoManager] Duration from expo-av:', duration, 'seconds');
          } else {
            // Sometimes duration isn't immediately available, try getting status again
            console.log('[VideoManager] Initial status has no duration, waiting...');
            await new Promise(r => setTimeout(r, 500));
            const updatedStatus = await sound.getStatusAsync();
            if (updatedStatus.isLoaded && updatedStatus.durationMillis && updatedStatus.durationMillis > 0) {
              duration = updatedStatus.durationMillis / 1000;
              console.log('[VideoManager] Duration from expo-av (retry):', duration, 'seconds');
            } else {
              console.log('[VideoManager] expo-av status after retry:', JSON.stringify(updatedStatus));
            }
          }
        } else {
          console.log('[VideoManager] expo-av status (not loaded):', JSON.stringify(status));
        }
        
        await sound.unloadAsync();
      } catch (audioError) {
        console.warn('[VideoManager] expo-av Audio loading failed:', audioError);
      }
      
      onProgress?.(0.5, 'Analyzing video dimensions...');
      
      // Get dimensions from thumbnail
      try {
        // Generate a thumbnail and get its dimensions (which match video dimensions)
        const { uri: thumbUri } = await VideoThumbnails.getThumbnailAsync(uri, {
          time: 100,
          quality: 0.5,
        });
        
        onProgress?.(0.7, 'Reading video dimensions...');
        
        // Get thumbnail dimensions which reflect video dimensions
        const getImageSize = (): Promise<{ width: number; height: number }> => {
          return new Promise((resolveSize, rejectSize) => {
            Image.getSize(
              thumbUri,
              (w, h) => {
                console.log('[VideoManager] Thumbnail dimensions:', w, 'x', h);
                resolveSize({ width: w, height: h });
              },
              (error) => {
                console.error('[VideoManager] Failed to get thumbnail size:', error);
                rejectSize(error);
              }
            );
          });
        };
        
        const dims = await getImageSize();
        width = dims.width;
        height = dims.height;
      } catch (thumbError) {
        console.error('[VideoManager] Could not get dimensions from thumbnail:', thumbError);
      }
      
      console.log('[VideoManager] Final metadata extracted:', { width, height, duration });
      onProgress?.(1.0, 'Complete');
      resolve(extractVideoMetadata(width, height, duration));
    } catch (error) {
      console.error('[VideoManager] Native metadata extraction failed:', error);
      onProgress?.(1.0, 'Complete');
      resolve(extractVideoMetadata());
    }
  });
};

export const downloadVideoFromUrl = async (
  url: string,
  onProgress?: (progress: DownloadProgress) => void
): Promise<VideoProcessingResult> => {
  if (Platform.OS === 'web') {
    return {
      success: false,
      error: 'Video download is not supported on web. Please use the video URL directly.',
    };
  }

  console.log('[VideoManager] Starting download from URL:', url);

  if (!isDirectVideoUrl(url)) {
    return {
      success: false,
      error: 'This URL is not supported. Please use a direct video link (e.g., .mp4, .mov files). YouTube, TikTok, Instagram, and other social media URLs are not supported.',
    };
  }

  try {
    ensureVideosDirectory();
    
    const videoId = await generateVideoId();
    const extension = getVideoExtension(url);
    const dateStr = formatDateForFilename();
    const fileName = `video_${dateStr}.${extension}`;
    
    const videosDir = getVideosDirectory();
    
    console.log('[VideoManager] Downloading to:', videosDir.uri);
    
    onProgress?.({
      bytesWritten: 0,
      totalBytes: 0,
      progress: 0.1,
      stage: 'downloading',
    });
    
    const downloadedFile = await File.downloadFileAsync(url, videosDir, {
      idempotent: true,
    });
    
    onProgress?.({
      bytesWritten: 0,
      totalBytes: 0,
      progress: 0.6,
      stage: 'processing',
    });
    
    const fileInfo = downloadedFile.info();
    const fileSize = fileInfo.size || 0;
    
    console.log('[VideoManager] Download complete, size:', fileSize);
    
    let finalUri = downloadedFile.uri;
    const currentName = Paths.basename(downloadedFile.uri);
    if (currentName !== fileName) {
      try {
        const newFile = new File(videosDir, fileName);
        downloadedFile.copy(newFile);
        downloadedFile.delete();
        finalUri = newFile.uri;
        console.log('[VideoManager] Renamed to:', fileName);
      } catch {
        console.log('[VideoManager] Could not rename, using original name:', currentName);
      }
    }
    
    onProgress?.({
      bytesWritten: fileSize,
      totalBytes: fileSize,
      progress: 0.8,
      stage: 'generating_thumbnail',
    });
    
    const thumbnailUri = await generateThumbnail(finalUri, videoId);
    
    const metadata = extractVideoMetadata();
    
    onProgress?.({
      bytesWritten: fileSize,
      totalBytes: fileSize,
      progress: 1.0,
      stage: 'complete',
    });
    
    const savedVideo: SavedVideo = {
      id: videoId,
      name: fileName,
      originalName: url.split('/').pop()?.split('?')[0] || fileName,
      uri: finalUri,
      sourceType: 'url',
      sourceUrl: url,
      fileSize,
      createdAt: new Date().toISOString(),
      thumbnailUri: thumbnailUri || undefined,
      metadata,
    };
    
    console.log('[VideoManager] Video saved successfully:', savedVideo.name);
    
    return {
      success: true,
      video: savedVideo,
    };
  } catch (error: any) {
    console.error('[VideoManager] Download failed:', error);
    
    let errorMessage = 'Failed to download video. ';
    if (error?.message?.includes('status')) {
      errorMessage += 'The server returned an error. Make sure the URL points directly to a video file.';
    } else if (error?.message?.includes('network') || error?.message?.includes('Network')) {
      errorMessage += 'Network error. Please check your internet connection.';
    } else if (error?.message?.includes('DestinationAlreadyExists')) {
      errorMessage += 'A file with this name already exists.';
    } else if (error?.message?.includes('CORS') || error?.message?.includes('cors')) {
      errorMessage += 'The server blocked the download (CORS). Try a different video host.';
    } else {
      errorMessage += error?.message || 'Unknown error occurred.';
    }
    
    return {
      success: false,
      error: errorMessage,
    };
  }
};

export const copyLocalVideo = async (
  sourceUri: string,
  originalName: string,
  onProgress?: (progress: DownloadProgress) => void
): Promise<VideoProcessingResult> => {
  if (Platform.OS === 'web') {
    const videoId = await generateVideoId();
    return {
      success: true,
      video: {
        id: videoId,
        name: originalName,
        originalName,
        uri: sourceUri,
        sourceType: 'local',
        fileSize: 0,
        createdAt: new Date().toISOString(),
      },
    };
  }

  console.log('[VideoManager] Copying local video:', sourceUri);

  try {
    ensureVideosDirectory();
    
    const videoId = await generateVideoId();
    const extension = getVideoExtension(originalName);
    const dateStr = formatDateForFilename();
    const fileName = `video_${dateStr}.${extension}`;
    
    onProgress?.({
      bytesWritten: 0,
      totalBytes: 0,
      progress: 0.2,
      stage: 'processing',
    });
    
    const sourceFile = new File(sourceUri);
    
    if (!sourceFile.exists) {
      console.log('[VideoManager] Source file not found, trying direct copy...');
      
      const videosDir = getVideosDirectory();
      const destinationFile = new File(videosDir, fileName);
      
      try {
        const response = await fetch(sourceUri);
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        destinationFile.write(uint8Array);
        
        const fileInfo = destinationFile.info();
        const fileSize = fileInfo.size || blob.size;
        
        onProgress?.({
          bytesWritten: fileSize,
          totalBytes: fileSize,
          progress: 0.7,
          stage: 'generating_thumbnail',
        });
        
        const thumbnailUri = await generateThumbnail(destinationFile.uri, videoId);
        const metadata = extractVideoMetadata();
        
        onProgress?.({
          bytesWritten: fileSize,
          totalBytes: fileSize,
          progress: 1.0,
          stage: 'complete',
        });
        
        const savedVideo: SavedVideo = {
          id: videoId,
          name: fileName,
          originalName,
          uri: destinationFile.uri,
          sourceType: 'local',
          fileSize,
          createdAt: new Date().toISOString(),
          thumbnailUri: thumbnailUri || undefined,
          metadata,
        };
        
        console.log('[VideoManager] Video copied successfully via fetch:', savedVideo.name);
        return { success: true, video: savedVideo };
      } catch (fetchError) {
        console.error('[VideoManager] Fetch copy failed:', fetchError);
        return {
          success: false,
          error: 'Source video file not found or cannot be accessed.',
        };
      }
    }
    
    const videosDir = getVideosDirectory();
    const destinationFile = new File(videosDir, fileName);
    
    console.log('[VideoManager] Copying to:', destinationFile.uri);
    
    sourceFile.copy(destinationFile);
    
    const fileInfo = destinationFile.info();
    const fileSize = fileInfo.size || 0;
    
    onProgress?.({
      bytesWritten: fileSize,
      totalBytes: fileSize,
      progress: 0.7,
      stage: 'generating_thumbnail',
    });
    
    console.log('[VideoManager] Copy complete, size:', fileSize);
    
    const thumbnailUri = await generateThumbnail(destinationFile.uri, videoId);
    const metadata = extractVideoMetadata();
    
    onProgress?.({
      bytesWritten: fileSize,
      totalBytes: fileSize,
      progress: 1.0,
      stage: 'complete',
    });
    
    const savedVideo: SavedVideo = {
      id: videoId,
      name: fileName,
      originalName,
      uri: destinationFile.uri,
      sourceType: 'local',
      fileSize,
      createdAt: new Date().toISOString(),
      thumbnailUri: thumbnailUri || undefined,
      metadata,
    };
    
    console.log('[VideoManager] Local video saved:', savedVideo.name);
    
    return {
      success: true,
      video: savedVideo,
    };
  } catch (error: any) {
    console.error('[VideoManager] Copy failed:', error);
    return {
      success: false,
      error: `Failed to copy video: ${error?.message || 'Unknown error'}`,
    };
  }
};

export const deleteVideo = async (uri: string, thumbnailUri?: string): Promise<boolean> => {
  if (Platform.OS === 'web') {
    return true;
  }

  try {
    const file = new File(uri);
    if (file.exists) {
      file.delete();
      console.log('[VideoManager] Deleted video:', uri);
    }
    
    if (thumbnailUri) {
      const thumbFile = new File(thumbnailUri);
      if (thumbFile.exists) {
        thumbFile.delete();
        console.log('[VideoManager] Deleted thumbnail:', thumbnailUri);
      }
    }
    
    return true;
  } catch (error) {
    console.error('[VideoManager] Failed to delete video:', error);
    return false;
  }
};

export const listSavedVideos = (): File[] => {
  if (Platform.OS === 'web') {
    return [];
  }

  try {
    const videosDir = getVideosDirectory();
    if (!videosDir.exists) {
      return [];
    }
    
    const contents = videosDir.list();
    const videoFiles = contents.filter(item => {
      if (item instanceof File) {
        const ext = Paths.extname(item.uri).toLowerCase().replace('.', '');
        return ['mp4', 'mov', 'webm', 'm4v', 'avi', 'mkv', '3gp'].includes(ext);
      }
      return false;
    }) as File[];
    
    return videoFiles;
  } catch (error) {
    console.error('[VideoManager] Failed to list videos:', error);
    return [];
  }
};

export const getVideoFileInfo = (file: File): Partial<SavedVideo> => {
  try {
    const info = file.info();
    const name = Paths.basename(file.uri);
    
    return {
      name,
      originalName: name,
      uri: file.uri,
      fileSize: info.size || 0,
      createdAt: info.creationTime 
        ? new Date(info.creationTime).toISOString() 
        : new Date().toISOString(),
    };
  } catch (error) {
    console.error('[VideoManager] Failed to get file info:', error);
    return {
      name: Paths.basename(file.uri),
      uri: file.uri,
      fileSize: 0,
    };
  }
};

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const getVideosDirectoryUri = (): string => {
  return getVideosDirectory().uri;
};

export const regenerateThumbnail = async (video: SavedVideo): Promise<string | null> => {
  if (Platform.OS === 'web') return null;
  
  console.log('[VideoManager] Regenerating thumbnail for:', video.name);
  return await generateThumbnail(video.uri, video.id);
};

export const getVideoLocalUri = (video: SavedVideo): string => {
  return video.uri;
};

export const isVideoReadyForSimulation = (video: SavedVideo): boolean => {
  if (Platform.OS === 'web') {
    return true;
  }
  
  try {
    const file = new File(video.uri);
    return file.exists;
  } catch {
    return false;
  }
};
