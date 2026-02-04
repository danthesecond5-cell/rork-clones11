import { checkVideoCompatibilityWithPlayback } from '@/utils/compatibility/webPlaybackCheck';
import { Platform } from 'react-native';
import type { SavedVideo } from '@/utils/videoManager';

// Mock react-native Platform
jest.mock('react-native', () => ({
  Platform: {
    OS: 'web',
  },
}));

// Mock the checkVideoCompatibility function
jest.mock('@/utils/compatibility/checkVideoCompatibility', () => ({
  checkVideoCompatibility: jest.fn().mockResolvedValue({
    overallStatus: 'warning',
    score: 50,
    items: [],
    summary: 'Could not fully analyze video. It may still work.',
    readyForSimulation: true,
    requiresModification: false,
    modifications: [],
  }),
}));

describe('checkVideoCompatibilityWithPlayback - Timeout Protection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset Platform.OS to web for each test
    (Platform as any).OS = 'web';
  });

  it('should resolve within 5 seconds even if video element hangs', async () => {
    const mockVideo: SavedVideo = {
      id: 'test-video-1',
      name: 'test.mp4',
      uri: 'blob:http://localhost:8081/invalid-blob',
      fileSize: 1024,
      sourceType: 'user-upload',
      metadata: {
        width: 1280,
        height: 720,
        duration: 30,
        orientation: 'landscape',
        aspectRatio: '16:9',
        isVertical: false,
      },
      dateAdded: Date.now(),
      thumbnailUri: undefined,
    };

    // Mock document.createElement to return a video element that never resolves
    const mockVideoEl = {
      preload: '',
      muted: false,
      playsInline: false,
      src: '',
      onloadedmetadata: null as any,
      onerror: null as any,
      onabort: null as any,
      load: jest.fn(),
      videoWidth: 0,
      videoHeight: 0,
      duration: 0,
      readyState: 0,
      error: null,
    };

    const originalCreateElement = document.createElement.bind(document);
    jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'video') {
        return mockVideoEl as any;
      }
      return originalCreateElement(tagName);
    });

    const startTime = Date.now();
    const result = await checkVideoCompatibilityWithPlayback(mockVideo);
    const endTime = Date.now();
    const elapsedTime = endTime - startTime;

    // Should complete within 5 seconds (hard timeout is 4 seconds + some buffer)
    expect(elapsedTime).toBeLessThan(5000);
    
    // Should return a valid result
    expect(result).toBeDefined();
    expect(result.overallStatus).toBe('warning');
    expect(result.readyForSimulation).toBe(true);

    // Cleanup
    document.createElement = originalCreateElement;
  }, 10000); // 10 second Jest timeout to be safe

  it('should use fallback check on non-web platforms', async () => {
    (Platform as any).OS = 'ios';

    const mockVideo: SavedVideo = {
      id: 'test-video-2',
      name: 'test.mp4',
      uri: 'file:///path/to/video.mp4',
      fileSize: 1024,
      sourceType: 'user-upload',
      metadata: {
        width: 1280,
        height: 720,
        duration: 30,
        orientation: 'landscape',
        aspectRatio: '16:9',
        isVertical: false,
      },
      dateAdded: Date.now(),
      thumbnailUri: undefined,
    };

    const result = await checkVideoCompatibilityWithPlayback(mockVideo);

    // Should return a valid result from the fallback
    expect(result).toBeDefined();
    expect(result.overallStatus).toBe('warning');
  });

  it('should abort video element on timeout', async () => {
    const mockVideo: SavedVideo = {
      id: 'test-video-3',
      name: 'test.mp4',
      uri: 'blob:http://localhost:8081/hanging-blob',
      fileSize: 1024,
      sourceType: 'user-upload',
      metadata: {
        width: 1280,
        height: 720,
        duration: 30,
        orientation: 'landscape',
        aspectRatio: '16:9',
        isVertical: false,
      },
      dateAdded: Date.now(),
      thumbnailUri: undefined,
    };

    const mockLoad = jest.fn();
    const mockVideoEl = {
      preload: '',
      muted: false,
      playsInline: false,
      src: '',
      onloadedmetadata: null as any,
      onerror: null as any,
      onabort: null as any,
      load: mockLoad,
      videoWidth: 0,
      videoHeight: 0,
      duration: 0,
      readyState: 0,
      error: null,
    };

    const originalCreateElement = document.createElement.bind(document);
    jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'video') {
        return mockVideoEl as any;
      }
      return originalCreateElement(tagName);
    });

    await checkVideoCompatibilityWithPlayback(mockVideo);

    // Video element's load() should be called during cleanup/abort
    expect(mockLoad).toHaveBeenCalled();

    // Cleanup
    document.createElement = originalCreateElement;
  }, 10000);
});
