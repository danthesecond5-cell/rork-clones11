/**
 * @jest-environment node
 *
 * Live smoke test against https://webcamtests.com/recorder
 *
 * This is intentionally gated behind an env var because it:
 * - hits the public internet
 * - requires a downloaded browser (Playwright)
 * - can be flaky due to network/site changes
 */

import { createMediaInjectionScript } from '@/constants/browserScripts';
import type { CaptureDevice } from '@/types/device';
import type { ProtocolId } from '@/types/protocols';

const shouldRun = process.env.RUN_LIVE_WEBCAMTESTS === '1';

const describeLive = shouldRun ? describe : describe.skip;

function buildDevices(): CaptureDevice[] {
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

describeLive('webcamtests.com/recorder - protocol smoke', () => {
  const protocols: ProtocolId[] = ['standard', 'allowlist', 'protected', 'harness', 'holographic'];

  // Playwright + navigation can take time in CI/VMs.
  jest.setTimeout(120_000);

  beforeAll(() => {
    // This repo enables fake timers globally; Playwright relies on real timers.
    jest.useRealTimers();
  });

  afterAll(() => {
    jest.useFakeTimers();
  });

  it.each(protocols)('records a blob via MediaRecorder (%s)', async (protocolId) => {
    // Lazy import so normal Jest runs don't require Playwright.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { chromium } = require('playwright') as typeof import('playwright');

    const browser = await chromium.launch({
      headless: true,
      args: [
        // Reduce random media restrictions / prompts.
        '--autoplay-policy=no-user-gesture-required',
        '--use-fake-ui-for-media-stream',
        '--no-sandbox',
      ],
    });

    let errors: string[] = [];

    try {
      const context = await browser.newContext();
      const page = await context.newPage();

      const script = createMediaInjectionScript(buildDevices(), {
        protocolId,
        stealthMode: true,
        forceSimulation: true,
        permissionPromptEnabled: false, // no RN bridge in Playwright
        debugEnabled: false,
        showOverlayLabel: false,
        loopVideo: true,
        mirrorVideo: false,
      });

      await page.addInitScript(script);

      errors = [];
      page.on('pageerror', (err: Error) => errors.push(String(err?.message || err)));
      page.on('console', (msg: any) => {
        try {
          if (msg.type && msg.type() === 'error') errors.push(msg.text());
        } catch {}
      });

      page.setDefaultTimeout(30_000);
      page.setDefaultNavigationTimeout(30_000);
      await page.goto('https://webcamtests.com/recorder', { waitUntil: 'domcontentloaded', timeout: 30_000 });

      // NOTE: This must not be `async` (Jest/Babel may transform async/await into helpers
      // that are not present inside the page context, causing ReferenceError).
      const result = await page.evaluate(() => {
        return navigator.mediaDevices.getUserMedia({ video: true, audio: false }).then((stream) => {
          const tracks = stream.getVideoTracks();
          const track = tracks && tracks.length ? tracks[0] : null;
          const settings = track && track.getSettings ? track.getSettings() : null;

          const recordedPromise = new Promise((resolve, reject) => {
            try {
              const chunks: BlobPart[] = [];
              const recorder = new MediaRecorder(stream);
              recorder.ondataavailable = (e) => {
                if (e && e.data && e.data.size > 0) chunks.push(e.data);
              };
              recorder.onerror = (e) => reject(new Error((e && e.error && e.error.message) || 'MediaRecorder error'));
              recorder.onstop = () => {
                const blob = new Blob(chunks, { type: recorder.mimeType || 'video/webm' });
                resolve(blob.size);
              };
              recorder.start();
              setTimeout(() => recorder.stop(), 750);
            } catch (e) {
              reject(e);
            }
          });

          return recordedPromise.then((recordedSize) => {
            stream.getTracks().forEach((t) => t.stop());
            return { recordedSize, settings };
          });
        });
      });

      if (errors.length) {
        throw new Error(`Page console errors:\n- ${errors.slice(0, 10).join('\n- ')}`);
      }

      expect(result.recordedSize).toBeGreaterThan(1024);
      expect(result.settings && result.settings.width).toBeTruthy();
      expect(result.settings && result.settings.height).toBeTruthy();
    } finally {
      await browser.close().catch(() => {});
    }
  });
});

