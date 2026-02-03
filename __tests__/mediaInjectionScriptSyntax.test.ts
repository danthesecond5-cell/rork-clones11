import { createMediaInjectionScript } from '@/constants/browserScripts';

describe('createMediaInjectionScript', () => {
  it('generates a syntactically valid async getUserMedia override', () => {
    const script = createMediaInjectionScript([], {
      stealthMode: true,
      fallbackVideoUri: 'canvas:default',
      forceSimulation: true,
      protocolId: 'standard',
      protocolLabel: 'Protocol 1: Standard Injection',
      showOverlayLabel: false,
      loopVideo: true,
      mirrorVideo: false,
      debugEnabled: false,
      permissionPromptEnabled: false,
    });

    // Regression guard: getUserMedia override must be async.
    // Implementation defines an async wrapper and injects it into mediaDevices.getUserMedia.
    expect(script).toMatch(/const\s+overrideGetUserMedia\s*=\s*async\s+function\s*\(/);
    expect(script).toContain("safeDefine(mediaDevices, 'getUserMedia', overrideGetUserMedia)");
  });
});

