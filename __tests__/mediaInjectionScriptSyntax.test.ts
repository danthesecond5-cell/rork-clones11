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

    // Regression guard: this function uses `await`, so it MUST be async.
    expect(script).toContain('const overrideGetUserMedia = async function');
    expect(script).toContain("safeDefine(mediaDevices, 'getUserMedia', overrideGetUserMedia)");
    expect(script).not.toContain('const overrideGetUserMedia = function');
  });
});

