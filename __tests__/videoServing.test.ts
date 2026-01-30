import { isLocalFileUri } from '@/utils/videoServing';

describe('videoServing - isLocalFileUri', () => {
  test('detects common local URI schemes', () => {
    expect(isLocalFileUri('file:///data/user/0/app/video.mp4')).toBe(true);
    expect(isLocalFileUri('/storage/emulated/0/Movies/video.mp4')).toBe(true);
    expect(isLocalFileUri('content://media/external/video/1')).toBe(true);
    expect(isLocalFileUri('ph://12345')).toBe(true);
  });

  test('does not misclassify remote URLs with local-looking paths', () => {
    expect(isLocalFileUri('https://example.com/saved_videos/video.mp4')).toBe(false);
    expect(isLocalFileUri('https://example.com/Documents/video.mp4')).toBe(false);
  });

  test('handles relative local paths without schemes', () => {
    expect(isLocalFileUri('saved_videos/video.mp4')).toBe(true);
    expect(isLocalFileUri('Documents/video.mp4')).toBe(true);
  });
});
