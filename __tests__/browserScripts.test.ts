import { createMediaInjectionScript } from '@/constants/browserScripts';
import type { CaptureDevice } from '@/types/device';

describe('createMediaInjectionScript', () => {
  it('emits an async getUserMedia override with forceSimulation guarded', () => {
    const devices: CaptureDevice[] = [
      {
        id: 'cam_front_1',
        name: 'Test Front Camera',
        type: 'camera',
        facing: 'front',
        lensType: 'standard',
        tested: true,
        simulationEnabled: true,
        capabilities: {
          photoResolutions: [],
          videoResolutions: [
            { width: 1080, height: 1920, label: '1080x1920', maxFps: 30 },
          ],
          supportedModes: [],
        },
      },
    ];

    const script = createMediaInjectionScript(devices, {
      stealthMode: true,
      protocolId: 'standard',
    });

    expect(script).toContain('const overrideGetUserMedia = async function');
    expect(script).toContain("safeDefine(mediaDevices, 'getUserMedia', overrideGetUserMedia)");
    expect(script).toContain('cfg.forceSimulation');
    expect(script).not.toContain('mediaDevices.getUserMedia = function');
  });
});
