/**
 * Deep Injection Protocols for Real Website Testing
 * 
 * This module contains multiple injection strategies that hook into
 * getUserMedia at different levels to replace camera feeds on real websites.
 * Each protocol uses a different approach to maximize compatibility.
 */

export interface InjectionConfig {
  videoUri?: string;
  width: number;
  height: number;
  fps: number;
  deviceLabel: string;
  deviceId: string;
  showDebugOverlay: boolean;
  useTestPattern: boolean;
}

const DEFAULT_CONFIG: InjectionConfig = {
  width: 1080,
  height: 1920,
  fps: 30,
  deviceLabel: 'Camera',
  deviceId: 'injected-camera-0',
  showDebugOverlay: false,
  useTestPattern: true,
};

/**
 * PROTOCOL 0: Ultra-Early Deep Hook
 * Hooks into the API before any other scripts load
 * Best for sites that check getUserMedia early
 */
export function createProtocol0DeepHook(config: Partial<InjectionConfig> = {}): string {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  
  return `
(function() {
  'use strict';
  
  // ============================================================================
  // PROTOCOL 0: ULTRA-EARLY DEEP HOOK
  // ============================================================================
  
  if (window.__protocol0Initialized) {
    console.log('[Protocol0] Already initialized');
    return;
  }
  window.__protocol0Initialized = true;
  
  console.log('[Protocol0] ===== DEEP HOOK INJECTION =====');
  console.log('[Protocol0] Target resolution: ${cfg.width}x${cfg.height} @ ${cfg.fps}fps');
  
  // ============================================================================
  // GLOBALS
  // ============================================================================
  
  const CONFIG = ${JSON.stringify(cfg)};
  let canvas = null;
  let ctx = null;
  let animationFrameId = null;
  let isAnimating = false;
  let frameCount = 0;
  let startTime = 0;
  let videoElement = null;
  let useVideo = false;
  
  // ============================================================================
  // CANVAS INITIALIZATION
  // ============================================================================
  
  function initCanvas() {
    if (canvas) return canvas;
    
    canvas = document.createElement('canvas');
    canvas.width = CONFIG.width;
    canvas.height = CONFIG.height;
    ctx = canvas.getContext('2d', { 
      alpha: false,
      desynchronized: true,
      willReadFrequently: false
    });
    
    console.log('[Protocol0] Canvas created:', CONFIG.width, 'x', CONFIG.height);
    return canvas;
  }
  
  // ============================================================================
  // VIDEO LOADING
  // ============================================================================
  
  function loadVideo(uri) {
    if (!uri || videoElement) return;
    
    console.log('[Protocol0] Loading video:', uri.substring(0, 50));
    
    videoElement = document.createElement('video');
    videoElement.muted = true;
    videoElement.loop = true;
    videoElement.playsInline = true;
    videoElement.setAttribute('playsinline', 'true');
    videoElement.setAttribute('webkit-playsinline', 'true');
    videoElement.crossOrigin = 'anonymous';
    videoElement.preload = 'auto';
    videoElement.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;';
    
    if (document.body) {
      document.body.appendChild(videoElement);
    } else {
      document.addEventListener('DOMContentLoaded', function() {
        if (document.body) document.body.appendChild(videoElement);
      });
    }
    
    videoElement.onloadeddata = function() {
      console.log('[Protocol0] Video loaded:', videoElement.videoWidth, 'x', videoElement.videoHeight);
      useVideo = true;
      videoElement.play().catch(function(e) {
        console.warn('[Protocol0] Autoplay failed:', e.message);
        useVideo = false;
      });
    };
    
    videoElement.onerror = function(e) {
      console.error('[Protocol0] Video load error:', e);
      useVideo = false;
    };
    
    videoElement.src = uri;
    videoElement.load();
  }
  
  // ============================================================================
  // RENDERING
  // ============================================================================
  
  function drawTestPattern(timestamp) {
    const t = timestamp / 1000;
    const w = CONFIG.width;
    const h = CONFIG.height;
    
    // Animated gradient
    const hue = (t * 30) % 360;
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'hsl(' + hue + ', 60%, 30%)');
    grad.addColorStop(0.5, 'hsl(' + ((hue + 120) % 360) + ', 60%, 20%)');
    grad.addColorStop(1, 'hsl(' + ((hue + 240) % 360) + ', 60%, 30%)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    
    // Animated circles
    for (let i = 0; i < 5; i++) {
      const angle = t * (1.5 + i * 0.3) + i * 1.2;
      const radius = 150 + i * 30;
      const x = w / 2 + Math.cos(angle) * radius;
      const y = h / 2 + Math.sin(angle) * radius;
      const r = 30 + i * 10;
      
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = 'hsla(' + ((hue + i * 60) % 360) + ', 70%, 60%, 0.8)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    
    // Status text
    if (CONFIG.showDebugOverlay) {
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.fillRect(10, h - 100, 400, 90);
      
      ctx.fillStyle = '#00ff00';
      ctx.font = 'bold 24px monospace';
      ctx.fillText('PROTOCOL 0 ACTIVE', 20, h - 70);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px monospace';
      ctx.fillText('Frame: ' + frameCount, 20, h - 45);
      ctx.fillText('Time: ' + t.toFixed(2) + 's', 20, h - 20);
    }
    
    // Scan line
    const scanY = (frameCount * 10) % h;
    ctx.fillStyle = 'rgba(0,255,0,0.3)';
    ctx.fillRect(0, scanY, w, 3);
  }
  
  function drawVideoFrame() {
    if (!videoElement || !useVideo || videoElement.paused || videoElement.ended) {
      return false;
    }
    
    try {
      const w = CONFIG.width;
      const h = CONFIG.height;
      const vw = videoElement.videoWidth || w;
      const vh = videoElement.videoHeight || h;
      
      // Cover mode
      const scale = Math.max(w / vw, h / vh);
      const sw = w / scale;
      const sh = h / scale;
      const sx = (vw - sw) / 2;
      const sy = (vh - sh) / 2;
      
      ctx.drawImage(videoElement, sx, sy, sw, sh, 0, 0, w, h);
      
      if (CONFIG.showDebugOverlay) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(10, 10, 250, 60);
        ctx.fillStyle = '#00ff00';
        ctx.font = 'bold 16px monospace';
        ctx.fillText('VIDEO INJECTION', 20, 35);
        ctx.fillText('Frame: ' + frameCount, 20, 55);
      }
      
      return true;
    } catch (e) {
      console.error('[Protocol0] Video draw error:', e);
      return false;
    }
  }
  
  function animate() {
    if (!isAnimating || !canvas || !ctx) return;
    
    const timestamp = performance.now();
    
    // Try video first, fallback to test pattern
    if (!drawVideoFrame()) {
      drawTestPattern(timestamp);
    }
    
    frameCount++;
    animationFrameId = requestAnimationFrame(animate);
  }
  
  function startAnimation() {
    if (isAnimating) return;
    
    initCanvas();
    isAnimating = true;
    startTime = performance.now();
    frameCount = 0;
    
    animate();
    console.log('[Protocol0] Animation started');
  }
  
  function stopAnimation() {
    isAnimating = false;
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    console.log('[Protocol0] Animation stopped');
  }
  
  // ============================================================================
  // STREAM CREATION
  // ============================================================================
  
  function createInjectedStream(constraints) {
    startAnimation();
    
    try {
      const stream = canvas.captureStream(CONFIG.fps);
      
      if (!stream || stream.getVideoTracks().length === 0) {
        throw new Error('Failed to create stream from canvas');
      }
      
      const videoTrack = stream.getVideoTracks()[0];
      
      // Spoof track settings
      const originalGetSettings = videoTrack.getSettings ? videoTrack.getSettings.bind(videoTrack) : null;
      videoTrack.getSettings = function() {
        return {
          width: CONFIG.width,
          height: CONFIG.height,
          frameRate: CONFIG.fps,
          aspectRatio: CONFIG.width / CONFIG.height,
          facingMode: constraints?.video?.facingMode || 'user',
          deviceId: CONFIG.deviceId,
          groupId: 'group_' + CONFIG.deviceId,
          resizeMode: 'none',
        };
      };
      
      // Spoof track capabilities
      videoTrack.getCapabilities = function() {
        return {
          width: { min: 1, max: CONFIG.width },
          height: { min: 1, max: CONFIG.height },
          frameRate: { min: 1, max: CONFIG.fps },
          aspectRatio: { min: 0.5, max: 2.0 },
          facingMode: ['user', 'environment'],
          deviceId: CONFIG.deviceId,
          resizeMode: ['none', 'crop-and-scale'],
        };
      };
      
      // Spoof track constraints
      videoTrack.getConstraints = function() {
        return constraints?.video || {};
      };
      
      // Spoof track label
      Object.defineProperty(videoTrack, 'label', {
        get: function() { return CONFIG.deviceLabel; },
        configurable: true,
      });
      
      // Add silent audio if requested
      if (constraints?.audio) {
        try {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          if (AudioContext) {
            const audioCtx = new AudioContext();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            const destination = audioCtx.createMediaStreamDestination();
            
            gainNode.gain.value = 0.0001; // Very quiet
            oscillator.connect(gainNode);
            gainNode.connect(destination);
            oscillator.start();
            
            destination.stream.getAudioTracks().forEach(function(track) {
              stream.addTrack(track);
            });
            
            console.log('[Protocol0] Added silent audio track');
          }
        } catch (e) {
          console.warn('[Protocol0] Failed to add audio:', e);
        }
      }
      
      console.log('[Protocol0] ✓ Stream created successfully');
      console.log('[Protocol0]   - Video tracks:', stream.getVideoTracks().length);
      console.log('[Protocol0]   - Audio tracks:', stream.getAudioTracks().length);
      console.log('[Protocol0]   - Resolution:', CONFIG.width + 'x' + CONFIG.height);
      
      return stream;
      
    } catch (e) {
      console.error('[Protocol0] ✗ Stream creation failed:', e);
      throw e;
    }
  }
  
  // ============================================================================
  // API OVERRIDE - CRITICAL EARLY HOOK
  // ============================================================================
  
  // Save original functions IMMEDIATELY
  const originalGetUserMedia = navigator.mediaDevices?.getUserMedia?.bind(navigator.mediaDevices);
  const originalEnumerateDevices = navigator.mediaDevices?.enumerateDevices?.bind(navigator.mediaDevices);
  
  // Ensure navigator.mediaDevices exists
  if (!navigator.mediaDevices) {
    navigator.mediaDevices = {};
  }
  
  // Override getUserMedia
  navigator.mediaDevices.getUserMedia = async function(constraints) {
    console.log('[Protocol0] ★ getUserMedia INTERCEPTED ★');
    console.log('[Protocol0] Constraints:', constraints);
    
    // Only intercept video requests
    if (constraints && constraints.video) {
      try {
        const stream = createInjectedStream(constraints);
        return Promise.resolve(stream);
      } catch (e) {
        console.error('[Protocol0] Injection failed:', e);
        // Fallback to original if available
        if (originalGetUserMedia) {
          console.log('[Protocol0] Falling back to original getUserMedia');
          return originalGetUserMedia(constraints);
        }
        throw e;
      }
    }
    
    // Audio-only or no constraints - use original
    if (originalGetUserMedia) {
      return originalGetUserMedia(constraints);
    }
    
    throw new DOMException('Requested device not found', 'NotFoundError');
  };
  
  // Override enumerateDevices
  navigator.mediaDevices.enumerateDevices = async function() {
    console.log('[Protocol0] enumerateDevices intercepted');
    
    const devices = [
      {
        deviceId: CONFIG.deviceId,
        groupId: 'group_' + CONFIG.deviceId,
        kind: 'videoinput',
        label: CONFIG.deviceLabel,
        toJSON: function() { return this; }
      },
      {
        deviceId: 'audio-' + CONFIG.deviceId,
        groupId: 'group_' + CONFIG.deviceId,
        kind: 'audioinput',
        label: 'Microphone',
        toJSON: function() { return this; }
      }
    ];
    
    console.log('[Protocol0] Returning', devices.length, 'devices');
    return Promise.resolve(devices);
  };
  
  // ============================================================================
  // CONFIGURATION API
  // ============================================================================
  
  window.__protocol0 = {
    setVideoUri: function(uri) {
      if (uri && !useVideo) {
        loadVideo(uri);
      }
    },
    
    useTestPattern: function() {
      useVideo = false;
      if (videoElement) {
        videoElement.pause();
      }
    },
    
    getStatus: function() {
      return {
        initialized: true,
        animating: isAnimating,
        frameCount: frameCount,
        usingVideo: useVideo,
        videoUri: CONFIG.videoUri,
        canvas: { width: CONFIG.width, height: CONFIG.height },
        fps: CONFIG.fps
      };
    },
    
    restart: function() {
      stopAnimation();
      frameCount = 0;
      startAnimation();
    }
  };
  
  // Load video if configured
  if (CONFIG.videoUri) {
    loadVideo(CONFIG.videoUri);
  }
  
  console.log('[Protocol0] ===== INJECTION COMPLETE =====');
  console.log('[Protocol0] Ready to intercept getUserMedia');
  console.log('[Protocol0] Test pattern:', CONFIG.useTestPattern ? 'YES' : 'NO');
  console.log('[Protocol0] Video URI:', CONFIG.videoUri || 'NONE');
  
  // Notify React Native if in WebView
  if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'protocol0Ready',
      config: CONFIG
    }));
  }
  
  return true;
})();
true;
`;
}

/**
 * PROTOCOL 1: MediaStream Constructor Override
 * Intercepts at the MediaStream level
 * Works for sites that construct MediaStream objects
 */
export function createProtocol1MediaStreamOverride(config: Partial<InjectionConfig> = {}): string {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  
  return `
(function() {
  'use strict';
  
  // ============================================================================
  // PROTOCOL 1: MEDIASTREAM CONSTRUCTOR OVERRIDE
  // ============================================================================
  
  if (window.__protocol1Initialized) {
    console.log('[Protocol1] Already initialized');
    return;
  }
  window.__protocol1Initialized = true;
  
  console.log('[Protocol1] ===== MEDIASTREAM OVERRIDE =====');
  
  const CONFIG = ${JSON.stringify(cfg)};
  
  // Store original constructors
  const OriginalMediaStream = window.MediaStream;
  const originalGetUserMedia = navigator.mediaDevices?.getUserMedia?.bind(navigator.mediaDevices);
  
  let injectedStream = null;
  let canvas = null;
  let ctx = null;
  let isAnimating = false;
  let frameCount = 0;
  
  // ============================================================================
  // CANVAS & ANIMATION (Simplified)
  // ============================================================================
  
  function initCanvas() {
    if (canvas) return;
    
    canvas = document.createElement('canvas');
    canvas.width = CONFIG.width;
    canvas.height = CONFIG.height;
    ctx = canvas.getContext('2d', { alpha: false });
    
    console.log('[Protocol1] Canvas initialized');
  }
  
  function animate() {
    if (!isAnimating) return;
    
    const t = performance.now() / 1000;
    const w = CONFIG.width;
    const h = CONFIG.height;
    
    // Simple animated gradient
    const hue = (t * 50) % 360;
    ctx.fillStyle = 'hsl(' + hue + ', 50%, 30%)';
    ctx.fillRect(0, 0, w, h);
    
    // Center circle
    ctx.beginPath();
    ctx.arc(w/2, h/2, 100 + Math.sin(t * 2) * 20, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fill();
    
    // Text
    ctx.fillStyle = 'black';
    ctx.font = 'bold 40px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PROTOCOL 1', w/2, h/2 + 15);
    
    frameCount++;
    requestAnimationFrame(animate);
  }
  
  function startAnimation() {
    if (isAnimating) return;
    initCanvas();
    isAnimating = true;
    animate();
    console.log('[Protocol1] Animation started');
  }
  
  function createInjectedStream() {
    startAnimation();
    
    try {
      const stream = canvas.captureStream(CONFIG.fps);
      const track = stream.getVideoTracks()[0];
      
      // Spoof track metadata
      track.getSettings = function() {
        return {
          width: CONFIG.width,
          height: CONFIG.height,
          frameRate: CONFIG.fps,
          facingMode: 'user',
          deviceId: CONFIG.deviceId
        };
      };
      
      Object.defineProperty(track, 'label', {
        get: () => CONFIG.deviceLabel,
        configurable: true
      });
      
      console.log('[Protocol1] Injected stream created');
      return stream;
    } catch (e) {
      console.error('[Protocol1] Stream creation failed:', e);
      throw e;
    }
  }
  
  // ============================================================================
  // API OVERRIDES
  // ============================================================================
  
  // Override getUserMedia
  if (navigator.mediaDevices) {
    navigator.mediaDevices.getUserMedia = async function(constraints) {
      console.log('[Protocol1] getUserMedia intercepted:', constraints);
      
      if (constraints?.video) {
        try {
          if (!injectedStream) {
            injectedStream = createInjectedStream();
          }
          return Promise.resolve(injectedStream);
        } catch (e) {
          console.error('[Protocol1] Failed:', e);
          if (originalGetUserMedia) {
            return originalGetUserMedia(constraints);
          }
          throw e;
        }
      }
      
      if (originalGetUserMedia) {
        return originalGetUserMedia(constraints);
      }
      throw new Error('getUserMedia not available');
    };
    
    navigator.mediaDevices.enumerateDevices = async function() {
      return [{
        deviceId: CONFIG.deviceId,
        groupId: 'group1',
        kind: 'videoinput',
        label: CONFIG.deviceLabel
      }];
    };
  }
  
  // Override MediaStream constructor
  window.MediaStream = function(arg) {
    console.log('[Protocol1] MediaStream constructor called:', arg);
    
    // If called with injected stream, return it
    if (arg && injectedStream && arg === injectedStream) {
      return new OriginalMediaStream(arg);
    }
    
    // Replace any video track with our injected one
    if (arg && (arg instanceof OriginalMediaStream || Array.isArray(arg))) {
      if (!injectedStream) {
        injectedStream = createInjectedStream();
      }
      
      const newStream = new OriginalMediaStream();
      injectedStream.getTracks().forEach(track => newStream.addTrack(track));
      
      console.log('[Protocol1] Replaced with injected stream');
      return newStream;
    }
    
    return new OriginalMediaStream(arg);
  };
  
  window.MediaStream.prototype = OriginalMediaStream.prototype;
  
  window.__protocol1 = {
    getStatus: () => ({
      initialized: true,
      hasStream: !!injectedStream,
      frameCount: frameCount
    })
  };
  
  console.log('[Protocol1] ===== INJECTION COMPLETE =====');
  
  return true;
})();
true;
`;
}

/**
 * PROTOCOL 2: Descriptor-Level Deep Hook
 * Overrides property descriptors to intercept at the lowest level
 */
export function createProtocol2DescriptorHook(config: Partial<InjectionConfig> = {}): string {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  
  return `
(function() {
  'use strict';
  
  // ============================================================================
  // PROTOCOL 2: DESCRIPTOR-LEVEL DEEP HOOK
  // ============================================================================
  
  if (window.__protocol2Initialized) {
    console.log('[Protocol2] Already initialized');
    return;
  }
  window.__protocol2Initialized = true;
  
  console.log('[Protocol2] ===== DESCRIPTOR HOOK =====');
  
  const CONFIG = ${JSON.stringify(cfg)};
  
  let canvas = null;
  let ctx = null;
  let animating = false;
  let frameNum = 0;
  
  // ============================================================================
  // SIMPLE RENDERER
  // ============================================================================
  
  function initCanvas() {
    if (canvas) return;
    canvas = document.createElement('canvas');
    canvas.width = CONFIG.width;
    canvas.height = CONFIG.height;
    ctx = canvas.getContext('2d');
    console.log('[Protocol2] Canvas ready');
  }
  
  function render() {
    if (!animating) return;
    
    const t = performance.now() / 1000;
    const hue = (t * 40) % 360;
    
    // Background
    ctx.fillStyle = 'hsl(' + hue + ', 60%, 25%)';
    ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);
    
    // Animated square
    ctx.save();
    ctx.translate(CONFIG.width / 2, CONFIG.height / 2);
    ctx.rotate(t);
    ctx.fillStyle = 'white';
    ctx.fillRect(-100, -100, 200, 200);
    ctx.restore();
    
    // Label
    ctx.fillStyle = 'black';
    ctx.font = 'bold 50px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PROTOCOL 2', CONFIG.width/2, CONFIG.height/2);
    
    frameNum++;
    requestAnimationFrame(render);
  }
  
  function start() {
    if (animating) return;
    initCanvas();
    animating = true;
    render();
  }
  
  function createStream() {
    start();
    try {
      const stream = canvas.captureStream(CONFIG.fps);
      console.log('[Protocol2] Stream created with', stream.getTracks().length, 'tracks');
      return stream;
    } catch (e) {
      console.error('[Protocol2] Stream creation failed:', e);
      throw e;
    }
  }
  
  // ============================================================================
  // DESCRIPTOR-LEVEL OVERRIDE
  // ============================================================================
  
  // Store original descriptor
  const originalDescriptor = Object.getOwnPropertyDescriptor(
    MediaDevices.prototype,
    'getUserMedia'
  );
  
  // Define new descriptor
  Object.defineProperty(MediaDevices.prototype, 'getUserMedia', {
    value: async function(constraints) {
      console.log('[Protocol2] Descriptor-level intercept:', constraints);
      
      if (constraints?.video) {
        try {
          return createStream();
        } catch (e) {
          console.error('[Protocol2] Failed:', e);
          if (originalDescriptor && originalDescriptor.value) {
            return originalDescriptor.value.call(this, constraints);
          }
          throw e;
        }
      }
      
      if (originalDescriptor && originalDescriptor.value) {
        return originalDescriptor.value.call(this, constraints);
      }
      throw new Error('getUserMedia not available');
    },
    configurable: true,
    enumerable: true,
    writable: true
  });
  
  // Also override enumerateDevices
  Object.defineProperty(MediaDevices.prototype, 'enumerateDevices', {
    value: async function() {
      console.log('[Protocol2] enumerateDevices intercepted');
      return [{
        deviceId: CONFIG.deviceId,
        groupId: 'default',
        kind: 'videoinput',
        label: CONFIG.deviceLabel
      }];
    },
    configurable: true,
    enumerable: true,
    writable: true
  });
  
  window.__protocol2 = {
    getStatus: () => ({
      initialized: true,
      animating: animating,
      frames: frameNum
    })
  };
  
  console.log('[Protocol2] ===== DESCRIPTOR HOOK COMPLETE =====');
  
  return true;
})();
true;
`;
}

/**
 * PROTOCOL 3: Proxy-Based Deep Intercept
 * Uses Proxy to intercept all method calls
 */
export function createProtocol3ProxyIntercept(config: Partial<InjectionConfig> = {}): string {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  
  return `
(function() {
  'use strict';
  
  // ============================================================================
  // PROTOCOL 3: PROXY-BASED INTERCEPT
  // ============================================================================
  
  if (window.__protocol3Initialized) {
    console.log('[Protocol3] Already initialized');
    return;
  }
  window.__protocol3Initialized = true;
  
  console.log('[Protocol3] ===== PROXY INTERCEPT =====');
  
  const CONFIG = ${JSON.stringify(cfg)};
  
  let canvas, ctx, animating = false, frames = 0;
  
  function init() {
    if (canvas) return;
    canvas = document.createElement('canvas');
    canvas.width = CONFIG.width;
    canvas.height = CONFIG.height;
    ctx = canvas.getContext('2d');
  }
  
  function draw() {
    if (!animating) return;
    
    const t = Date.now() / 1000;
    const hue = (t * 60) % 360;
    
    // Gradient
    const grad = ctx.createRadialGradient(
      CONFIG.width/2, CONFIG.height/2, 0,
      CONFIG.width/2, CONFIG.height/2, CONFIG.width/2
    );
    grad.addColorStop(0, 'hsl(' + hue + ', 70%, 40%)');
    grad.addColorStop(1, 'hsl(' + ((hue + 180) % 360) + ', 70%, 20%)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);
    
    // Circle
    ctx.beginPath();
    ctx.arc(
      CONFIG.width/2 + Math.cos(t) * 200,
      CONFIG.height/2 + Math.sin(t) * 200,
      80, 0, Math.PI * 2
    );
    ctx.fillStyle = 'white';
    ctx.fill();
    
    frames++;
    requestAnimationFrame(draw);
  }
  
  function start() {
    if (animating) return;
    init();
    animating = true;
    draw();
  }
  
  function makeStream() {
    start();
    return canvas.captureStream(CONFIG.fps);
  }
  
  // ============================================================================
  // PROXY INTERCEPT
  // ============================================================================
  
  const originalMediaDevices = navigator.mediaDevices;
  
  navigator.mediaDevices = new Proxy(originalMediaDevices, {
    get(target, prop) {
      if (prop === 'getUserMedia') {
        return async function(constraints) {
          console.log('[Protocol3] Proxy getUserMedia:', constraints);
          
          if (constraints?.video) {
            try {
              const stream = makeStream();
              console.log('[Protocol3] Returning injected stream');
              return stream;
            } catch (e) {
              console.error('[Protocol3] Failed:', e);
              return target.getUserMedia(constraints);
            }
          }
          
          return target.getUserMedia(constraints);
        };
      }
      
      if (prop === 'enumerateDevices') {
        return async function() {
          console.log('[Protocol3] Proxy enumerateDevices');
          return [{
            deviceId: CONFIG.deviceId,
            groupId: 'default',
            kind: 'videoinput',
            label: CONFIG.deviceLabel
          }];
        };
      }
      
      return target[prop];
    }
  });
  
  window.__protocol3 = {
    getStatus: () => ({ initialized: true, animating, frames })
  };
  
  console.log('[Protocol3] ===== PROXY INTERCEPT COMPLETE =====');
  
  return true;
})();
true;
`;
}

/**
 * Create a comprehensive test page that tests all protocols
 */
export function createProtocolTestPage(testUrl: string = 'https://webcamtests.com/recorder'): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Protocol Test Suite</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, system-ui, sans-serif;
      background: #0a0a0a;
      color: #fff;
      padding: 20px;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 {
      font-size: 24px;
      margin-bottom: 20px;
      color: #00ff88;
    }
    .protocol-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
      margin-bottom: 30px;
    }
    .protocol-card {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 12px;
      padding: 16px;
    }
    .protocol-card.testing { border-color: #ffaa00; }
    .protocol-card.success { border-color: #00ff88; }
    .protocol-card.failed { border-color: #ff4444; }
    
    .protocol-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .protocol-name {
      font-size: 16px;
      font-weight: 600;
    }
    .protocol-status {
      font-size: 12px;
      padding: 4px 8px;
      border-radius: 4px;
      background: rgba(255,255,255,0.1);
    }
    .protocol-status.testing { background: rgba(255,170,0,0.2); color: #ffaa00; }
    .protocol-status.success { background: rgba(0,255,136,0.2); color: #00ff88; }
    .protocol-status.failed { background: rgba(255,68,68,0.2); color: #ff4444; }
    
    .protocol-desc {
      font-size: 13px;
      color: rgba(255,255,255,0.6);
      margin-bottom: 12px;
    }
    .protocol-result {
      font-size: 12px;
      font-family: monospace;
      background: rgba(0,0,0,0.3);
      padding: 8px;
      border-radius: 4px;
      max-height: 100px;
      overflow-y: auto;
    }
    
    button {
      background: #00ff88;
      color: #000;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      margin-right: 12px;
      margin-bottom: 12px;
    }
    button:hover { background: #00dd77; }
    button:disabled {
      background: rgba(255,255,255,0.2);
      color: rgba(255,255,255,0.5);
      cursor: not-allowed;
    }
    
    .test-area {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
    }
    video {
      width: 100%;
      max-width: 400px;
      height: auto;
      border-radius: 8px;
      background: #000;
    }
    
    .summary {
      background: rgba(0,255,136,0.1);
      border: 1px solid rgba(0,255,136,0.3);
      border-radius: 12px;
      padding: 16px;
      margin-top: 20px;
    }
    .summary h2 {
      font-size: 18px;
      margin-bottom: 12px;
      color: #00ff88;
    }
    .summary-item {
      font-size: 14px;
      margin: 8px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔬 Deep Injection Protocol Test Suite</h1>
    
    <div class="test-area">
      <h2 style="font-size: 18px; margin-bottom: 12px;">Test Controls</h2>
      <button id="testAllBtn">Test All Protocols</button>
      <button id="testP0Btn">Test Protocol 0</button>
      <button id="testP1Btn">Test Protocol 1</button>
      <button id="testP2Btn">Test Protocol 2</button>
      <button id="testP3Btn">Test Protocol 3</button>
      <button id="clearBtn">Clear Results</button>
      
      <div style="margin-top: 16px;">
        <video id="testVideo" autoplay playsinline muted></video>
      </div>
    </div>
    
    <div class="protocol-grid" id="protocolGrid">
      <!-- Protocol cards will be inserted here -->
    </div>
    
    <div class="summary" id="summary" style="display: none;">
      <h2>📊 Test Summary</h2>
      <div id="summaryContent"></div>
    </div>
  </div>
  
  <script>
    const protocols = [
      {
        id: 'protocol0',
        name: 'Protocol 0: Ultra-Early Hook',
        desc: 'Hooks getUserMedia before page scripts load',
        status: 'idle',
        result: ''
      },
      {
        id: 'protocol1',
        name: 'Protocol 1: MediaStream Override',
        desc: 'Intercepts MediaStream constructor',
        status: 'idle',
        result: ''
      },
      {
        id: 'protocol2',
        name: 'Protocol 2: Descriptor Hook',
        desc: 'Overrides property descriptors',
        status: 'idle',
        result: ''
      },
      {
        id: 'protocol3',
        name: 'Protocol 3: Proxy Intercept',
        desc: 'Uses Proxy to intercept calls',
        status: 'idle',
        result: ''
      }
    ];
    
    let testResults = {
      tested: 0,
      passed: 0,
      failed: 0
    };
    
    function renderProtocols() {
      const grid = document.getElementById('protocolGrid');
      grid.innerHTML = protocols.map(p => \`
        <div class="protocol-card \${p.status === 'testing' ? 'testing' : p.status === 'success' ? 'success' : p.status === 'failed' ? 'failed' : ''}" id="\${p.id}Card">
          <div class="protocol-header">
            <div class="protocol-name">\${p.name}</div>
            <div class="protocol-status \${p.status}">\${p.status.toUpperCase()}</div>
          </div>
          <div class="protocol-desc">\${p.desc}</div>
          <div class="protocol-result" id="\${p.id}Result">\${p.result || 'Not tested yet'}</div>
        </div>
      \`).join('');
    }
    
    function updateProtocol(id, status, result) {
      const protocol = protocols.find(p => p.id === id);
      if (protocol) {
        protocol.status = status;
        protocol.result = result;
        renderProtocols();
      }
    }
    
    function updateSummary() {
      const summary = document.getElementById('summary');
      const content = document.getElementById('summaryContent');
      
      if (testResults.tested > 0) {
        summary.style.display = 'block';
        content.innerHTML = \`
          <div class="summary-item">✓ Tests Completed: \${testResults.tested}/4</div>
          <div class="summary-item" style="color: #00ff88;">✓ Passed: \${testResults.passed}</div>
          <div class="summary-item" style="color: #ff4444;">✗ Failed: \${testResults.failed}</div>
          <div class="summary-item" style="margin-top: 12px; font-weight: 600;">
            Success Rate: \${Math.round(testResults.passed / testResults.tested * 100)}%
          </div>
        \`;
      } else {
        summary.style.display = 'none';
      }
    }
    
    async function testProtocol(id, injectionScript) {
      console.log(\`Testing \${id}...\`);
      updateProtocol(id, 'testing', 'Injecting script...');
      
      try {
        // Inject the protocol
        eval(injectionScript);
        updateProtocol(id, 'testing', 'Script injected, testing getUserMedia...');
        
        // Wait a bit for injection to settle
        await new Promise(r => setTimeout(r, 100));
        
        // Test getUserMedia
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 }
        });
        
        if (!stream || stream.getVideoTracks().length === 0) {
          throw new Error('No video tracks in stream');
        }
        
        // Attach to video element
        const video = document.getElementById('testVideo');
        video.srcObject = stream;
        
        // Check if video is actually playing
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Video play timeout')), 5000);
          video.onloadedmetadata = () => {
            clearTimeout(timeout);
            resolve();
          };
        });
        
        const track = stream.getVideoTracks()[0];
        const settings = track.getSettings();
        
        updateProtocol(id, 'success', \`✓ SUCCESS\\nResolution: \${settings.width}x\${settings.height}\\nFPS: \${settings.frameRate || 'unknown'}\\nLabel: \${track.label}\`);
        
        testResults.tested++;
        testResults.passed++;
        
        // Stop the stream
        setTimeout(() => {
          stream.getTracks().forEach(t => t.stop());
        }, 2000);
        
        return true;
        
      } catch (error) {
        console.error(\`\${id} failed:\`, error);
        updateProtocol(id, 'failed', \`✗ FAILED\\n\${error.message}\`);
        testResults.tested++;
        testResults.failed++;
        return false;
      } finally {
        updateSummary();
      }
    }
    
    // Button handlers
    document.getElementById('testAllBtn').onclick = async function() {
      testResults = { tested: 0, passed: 0, failed: 0 };
      
      // Test each protocol sequentially
      // Note: In real implementation, inject via message from React Native
      await new Promise(r => setTimeout(r, 500));
      
      alert('In production, protocols would be injected via React Native WebView. Click individual test buttons to test manually injected protocols.');
    };
    
    document.getElementById('clearBtn').onclick = function() {
      protocols.forEach(p => {
        p.status = 'idle';
        p.result = '';
      });
      testResults = { tested: 0, passed: 0, failed: 0 };
      renderProtocols();
      updateSummary();
      
      const video = document.getElementById('testVideo');
      if (video.srcObject) {
        video.srcObject.getTracks().forEach(t => t.stop());
        video.srcObject = null;
      }
    };
    
    // Initial render
    renderProtocols();
    console.log('Protocol Test Suite Ready');
    console.log('Use buttons to test individual protocols or test all at once');
  </script>
</body>
</html>
`;
}

/**
 * Export all protocol generators
 */
export const DEEP_INJECTION_PROTOCOLS = {
  protocol0: createProtocol0DeepHook,
  protocol1: createProtocol1MediaStreamOverride,
  protocol2: createProtocol2DescriptorHook,
  protocol3: createProtocol3ProxyIntercept,
  testPage: createProtocolTestPage,
};
