/**
 * @jest-environment node
 */

import { createMediaInjectionScript } from '@/constants/browserScripts';
import type { CaptureDevice } from '@/types/device';
import type { ProtocolId } from '@/types/protocols';

function buildTestDevices(): CaptureDevice[] {
  return [
    {
      id: 'cam_front_1',
      nativeDeviceId: 'cam_front_1',
      name: 'Front Camera',
      type: 'camera',
      facing: 'front',
      groupId: 'default',
      simulationEnabled: true,
      assignedVideoUri: 'canvas:default',
      assignedVideoName: 'Test Pattern',
      capabilities: {
        videoResolutions: [{ width: 1080, height: 1920, fps: 30 }],
      },
    } as unknown as CaptureDevice,
  ];
}

describe('createMediaInjectionScript - syntax safety', () => {
  const protocols: ProtocolId[] = ['standard', 'allowlist', 'protected', 'harness', 'holographic'];

  it.each(protocols)('generates JS that parses cleanly (%s)', (protocolId) => {
    const devices = buildTestDevices();
    const script = createMediaInjectionScript(devices, {
      protocolId,
      stealthMode: true,
      forceSimulation: true,
      permissionPromptEnabled: false,
      debugEnabled: false,
      showOverlayLabel: false,
    });

    // Parse-only check: catch regressions like `await` inside non-async functions.
    expect(() => new Function(script)).not.toThrow();

    // Ensure our async override is present (this is the historical breakage).
    expect(script).toContain('mediaDevices.getUserMedia = async function');
  });
});

