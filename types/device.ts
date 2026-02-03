export type CameraLensType = 
  | 'wide' 
  | 'ultrawide' 
  | 'telephoto' 
  | 'periscope'
  | 'macro' 
  | 'depth' 
  | 'lidar' 
  | 'truedepth' 
  | 'infrared' 
  | 'monochrome'
  | 'tof'
  | 'standard';

export type CameraMode = 
  | 'photo'
  | 'video'
  | 'portrait'
  | 'night'
  | 'cinematic'
  | 'slowmo'
  | 'timelapse'
  | 'pano'
  | 'macro'
  | 'proraw'
  | 'prores'
  | 'spatial'
  | 'action';

export interface VideoResolution {
  width: number;
  height: number;
  label?: string;
  maxFps?: number;
  fps?: number;
}

export interface PhotoResolution {
  width: number;
  height: number;
  megapixels: number;
  label: string;
}

export interface CameraCapabilities {
  photoResolutions: PhotoResolution[];
  videoResolutions: VideoResolution[];
  supportedModes: CameraMode[];
  maxOpticalZoom?: number;
  maxDigitalZoom?: number;
  aperture?: string;
  sensorSize?: string;
  focalLength?: string;
  pixelSize?: string;
  hasOIS?: boolean;
  hasAutoFocus?: boolean;
  hasPhaseDetection?: boolean;
  hasLaserAF?: boolean;
  hasFlash?: boolean;
  hasTrueTone?: boolean;
  supportsHDR?: boolean;
  supportsHDR10?: boolean;
  supportsDolbyVision?: boolean;
  supportsNightMode?: boolean;
  supportsPortrait?: boolean;
  supportsCinematic?: boolean;
  supportsProRAW?: boolean;
  supportsProRes?: boolean;
  supportsSpatialVideo?: boolean;
  supportsActionMode?: boolean;
  supportsSlowMo?: boolean;
  slowMoFps?: number[];
  supportsTimeLapse?: boolean;
  supportsPanorama?: boolean;
  supportsMacro?: boolean;
  supportsPhotogenicStyles?: boolean;
  supportsSmartHDR?: boolean;
  smartHDRVersion?: number;
  supportsDeepFusion?: boolean;
  supportsLivePhoto?: boolean;
  supportsRawCapture?: boolean;
  supports48MP?: boolean;
  supports200MP?: boolean;
  supportsQuadBayer?: boolean;
  supportsPixelBinning?: boolean;
}

export interface CaptureDevice {
  id: string;
  name: string;
  type: 'camera';
  facing: 'front' | 'back' | 'external';
  lensType: CameraLensType;
  zoomFactor?: string;
  equivalentFocalLength?: string;
  sensorIndex?: number;
  isDefault?: boolean;
  isPrimary?: boolean;
  tested: boolean;
  testResult?: 'success' | 'failed' | 'pending';
  simulationEnabled: boolean;
  assignedVideoUri?: string;
  assignedVideoName?: string;
  nativeDeviceId?: string;
  groupId?: string;
  capabilities?: CameraCapabilities;
  hardwareInfo?: {
    manufacturer?: string;
    sensorModel?: string;
    sensorSize?: string;
    megapixels?: number;
    aperture?: string;
    focalLength?: string;
  };
}

export interface PermissionStatus {
  name: string;
  status: 'granted' | 'denied' | 'undetermined';
  requested: boolean;
}

export interface DeviceModelInfo {
  platform: string;
  osVersion: string;
  deviceName: string;
  brand?: string;
  model?: string;
  modelId?: string;
  totalCameras?: number;
  supportedFeatures?: string[];
}

export interface DeviceTemplate {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  deviceInfo: DeviceModelInfo;
  captureDevices: CaptureDevice[];
  permissions: PermissionStatus[];
  isComplete: boolean;
}

export interface ActiveCameraStatus {
  deviceId: string;
  isActive: boolean;
  isSimulating: boolean;
  currentTime?: number;
  duration?: number;
}

export interface CameraSystemInfo {
  totalLenses: number;
  frontCameras: number;
  backCameras: number;
  hasUltraWide: boolean;
  hasTelephoto: boolean;
  hasPeriscope: boolean;
  hasMacro: boolean;
  hasLiDAR: boolean;
  hasDepthSensor: boolean;
  maxPhotoResolution: string;
  maxVideoResolution: string;
  supportedModes: CameraMode[];
}
