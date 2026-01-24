import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { 
  ErrorCode, 
  createAppError, 
  getErrorMessage, 
  safeJsonParse,
  safeJsonStringify,
  validateTemplateName,
  AppError,
} from '@/utils/errorHandling';
import type { WebsiteSettings } from '@/types/browser';
import type {
  CaptureDevice,
  DeviceModelInfo,
  DeviceTemplate,
  ActiveCameraStatus,
} from '@/types/device';
import { formatVideoUriForWebView } from '@/utils/videoServing';

interface DeviceTemplateContextValue {
  templates: DeviceTemplate[];
  activeTemplate: DeviceTemplate | null;
  isLoading: boolean;
  hasCompletedSetup: boolean;
  hasMatchingTemplate: boolean;
  currentDeviceInfo: DeviceModelInfo | null;
  activeCameras: ActiveCameraStatus[];
  stealthMode: boolean;
  websiteSettings: WebsiteSettings[];
  error: AppError | null;
  clearError: () => void;
  createTemplate: (template: Omit<DeviceTemplate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<DeviceTemplate>;
  updateTemplate: (id: string, updates: Partial<DeviceTemplate>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  setActiveTemplate: (id: string | null) => void;
  updateCaptureDevice: (templateId: string, deviceId: string, updates: Partial<CaptureDevice>) => Promise<void>;
  assignVideoToDevice: (templateId: string, deviceId: string, videoUri: string, videoName: string, autoEnableSim?: boolean) => Promise<void>;
  assignVideoToAllDevices: (templateId: string, videoUri: string, videoName: string, deviceType?: 'camera' | 'microphone', autoEnableSim?: boolean) => Promise<void>;
  clearVideoFromDevice: (templateId: string, deviceId: string) => Promise<void>;
  toggleDeviceSimulation: (templateId: string, deviceId: string) => Promise<void>;
  toggleStealthMode: () => void;
  retryLoadTemplates: () => Promise<void>;
  findMatchingTemplate: () => DeviceTemplate | null;
  updateCameraStatus: (deviceId: string, status: Partial<ActiveCameraStatus>) => void;
  clearAllCameraStatus: () => void;
  generateTemplateName: (deviceInfo: DeviceModelInfo) => string;
  getWebsiteSettings: (url: string) => WebsiteSettings | null;
  saveWebsiteSettings: (url: string, settings: { useStealthByDefault: boolean; applyToSubdomains: boolean }) => Promise<void>;
  deleteWebsiteSettings: (id: string) => Promise<void>;
  shouldUseStealthForUrl: (url: string) => boolean;
}

const STORAGE_KEY = '@device_templates';
const ACTIVE_TEMPLATE_KEY = '@active_template_id';
const STEALTH_MODE_KEY = '@stealth_mode';
const WEBSITE_SETTINGS_KEY = '@website_settings';
const MAX_TEMPLATES = 50;
const MAX_DEVICES_PER_TEMPLATE = 20;

export const [DeviceTemplateProvider, useDeviceTemplate] = createContextHook<DeviceTemplateContextValue>(() => {
  const [templates, setTemplates] = useState<DeviceTemplate[]>([]);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  const [currentDeviceInfo, setCurrentDeviceInfo] = useState<DeviceModelInfo | null>(null);
  const [activeCameras, setActiveCameras] = useState<ActiveCameraStatus[]>([]);
  const [stealthMode, setStealthMode] = useState<boolean>(true);
  const [websiteSettings, setWebsiteSettings] = useState<WebsiteSettings[]>([]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const generateTemplateName = useCallback((deviceInfo: DeviceModelInfo): string => {
    const modelPart = deviceInfo.model || deviceInfo.brand || 'Unknown';
    const devicePart = deviceInfo.deviceName || 'Device';
    return `${modelPart} - ${devicePart}`;
  }, []);

  const getCurrentDeviceInfo = useCallback((): DeviceModelInfo => {
    const info: DeviceModelInfo = {
      platform: Platform.OS,
      osVersion: Platform.Version?.toString() || 'Unknown',
      deviceName: Device.deviceName || 'Unknown Device',
      brand: Device.brand || undefined,
      model: Device.modelName || undefined,
      modelId: Device.modelId || Device.modelName || undefined,
    };
    return info;
  }, []);

  useEffect(() => {
    const info = getCurrentDeviceInfo();
    setCurrentDeviceInfo(info);
    console.log('[DeviceTemplate] Current device info:', info);
  }, [getCurrentDeviceInfo]);

  const findMatchingTemplate = useCallback((): DeviceTemplate | null => {
    if (!currentDeviceInfo) return null;
    
    const exactMatch = templates.find(t => 
      t.deviceInfo.model === currentDeviceInfo.model &&
      t.deviceInfo.brand === currentDeviceInfo.brand &&
      t.isComplete
    );
    
    if (exactMatch) {
      console.log('[DeviceTemplate] Found exact model match:', exactMatch.name);
      return exactMatch;
    }

    const modelMatch = templates.find(t =>
      t.deviceInfo.modelId === currentDeviceInfo.modelId &&
      t.isComplete
    );

    if (modelMatch) {
      console.log('[DeviceTemplate] Found modelId match:', modelMatch.name);
      return modelMatch;
    }

    const platformMatch = templates.find(t =>
      t.deviceInfo.platform === currentDeviceInfo.platform &&
      t.deviceInfo.model === currentDeviceInfo.model &&
      t.isComplete
    );

    if (platformMatch) {
      console.log('[DeviceTemplate] Found platform+model match:', platformMatch.name);
      return platformMatch;
    }

    console.log('[DeviceTemplate] No matching template found for device');
    return null;
  }, [templates, currentDeviceInfo]);

  const loadTemplates = useCallback(async () => {
    console.log('[DeviceTemplate] Loading templates from storage...');
    setIsLoading(true);
    setError(null);
    
    try {
      const [templatesData, activeId] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(ACTIVE_TEMPLATE_KEY),
      ]);
      
      if (templatesData) {
        const parsed = safeJsonParse<DeviceTemplate[]>(templatesData, []);
        
        if (!Array.isArray(parsed)) {
          console.error('[DeviceTemplate] Invalid templates data format, resetting...');
          setTemplates([]);
        } else {
          const validTemplates = parsed.filter(t => 
            t && typeof t === 'object' && 
            typeof t.id === 'string' && 
            typeof t.name === 'string' &&
            Array.isArray(t.captureDevices)
          );
          
          if (validTemplates.length !== parsed.length) {
            console.warn('[DeviceTemplate] Filtered out invalid templates:', parsed.length - validTemplates.length);
          }
          
          setTemplates(validTemplates);
          console.log('[DeviceTemplate] Loaded', validTemplates.length, 'templates');
        }
      } else {
        console.log('[DeviceTemplate] No templates found in storage');
        setTemplates([]);
      }
      
      if (activeId && typeof activeId === 'string') {
        setActiveTemplateId(activeId);
        console.log('[DeviceTemplate] Active template:', activeId);
      }
    } catch (err) {
      const appError = createAppError(
        ErrorCode.STORAGE,
        'Failed to load device templates: ' + getErrorMessage(err),
        err
      );
      setError(appError);
      setTemplates([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  useEffect(() => {
    const loadStealthMode = async () => {
      try {
        const stored = await AsyncStorage.getItem(STEALTH_MODE_KEY);
        if (stored !== null) {
          setStealthMode(stored === 'true');
          console.log('[DeviceTemplate] Loaded stealth mode:', stored === 'true');
        }
      } catch (err) {
        console.error('[DeviceTemplate] Failed to load stealth mode:', err);
      }
    };
    loadStealthMode();
  }, []);

  useEffect(() => {
    const loadWebsiteSettings = async () => {
      try {
        const stored = await AsyncStorage.getItem(WEBSITE_SETTINGS_KEY);
        if (stored) {
          const parsed = safeJsonParse<WebsiteSettings[]>(stored, []);
          setWebsiteSettings(parsed);
          console.log('[DeviceTemplate] Loaded website settings:', parsed.length);
        }
      } catch (err) {
        console.error('[DeviceTemplate] Failed to load website settings:', err);
      }
    };
    loadWebsiteSettings();
  }, []);

  useEffect(() => {
    if (!isLoading && templates.length > 0 && !activeTemplateId) {
      const matching = findMatchingTemplate();
      if (matching) {
        setActiveTemplateId(matching.id);
        AsyncStorage.setItem(ACTIVE_TEMPLATE_KEY, matching.id).catch(console.error);
        console.log('[DeviceTemplate] Auto-selected matching template:', matching.name);
      }
    }
  }, [isLoading, templates, activeTemplateId, findMatchingTemplate]);

  const saveTemplates = async (newTemplates: DeviceTemplate[]): Promise<boolean> => {
    console.log('[DeviceTemplate] Saving templates to storage...');
    
    try {
      if (!Array.isArray(newTemplates)) {
        throw new Error('Invalid templates data: expected array');
      }
      
      const jsonString = safeJsonStringify(newTemplates);
      if (!jsonString) {
        throw new Error('Failed to serialize templates');
      }
      
      await AsyncStorage.setItem(STORAGE_KEY, jsonString);
      setTemplates(newTemplates);
      console.log('[DeviceTemplate] Saved', newTemplates.length, 'templates');
      return true;
    } catch (err) {
      const appError = createAppError(
        ErrorCode.STORAGE,
        'Failed to save templates: ' + getErrorMessage(err),
        err
      );
      setError(appError);
      console.error('[DeviceTemplate] Save failed:', err);
      return false;
    }
  };

  const createTemplate = useCallback(async (templateData: Omit<DeviceTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<DeviceTemplate> => {
    console.log('[DeviceTemplate] Creating new template...');
    
    const nameValidation = validateTemplateName(templateData.name);
    if (!nameValidation.valid) {
      const appError = createAppError(
        ErrorCode.INVALID_INPUT,
        nameValidation.error || 'Invalid template name'
      );
      setError(appError);
      throw new Error(nameValidation.error);
    }
    
    if (templates.length >= MAX_TEMPLATES) {
      const appError = createAppError(
        ErrorCode.INVALID_INPUT,
        `Maximum number of templates (${MAX_TEMPLATES}) reached. Please delete some templates first.`
      );
      setError(appError);
      throw new Error(appError.message);
    }
    
    if (templateData.captureDevices && templateData.captureDevices.length > MAX_DEVICES_PER_TEMPLATE) {
      const appError = createAppError(
        ErrorCode.INVALID_INPUT,
        `Maximum number of devices per template (${MAX_DEVICES_PER_TEMPLATE}) exceeded.`
      );
      setError(appError);
      throw new Error(appError.message);
    }
    
    const now = new Date().toISOString();
    const newTemplate: DeviceTemplate = {
      ...templateData,
      id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
    };
    
    const newTemplates = [...templates, newTemplate];
    const saved = await saveTemplates(newTemplates);
    
    if (!saved) {
      throw new Error('Failed to save template');
    }
    
    try {
      await AsyncStorage.setItem(ACTIVE_TEMPLATE_KEY, newTemplate.id);
      setActiveTemplateId(newTemplate.id);
    } catch (err) {
      console.error('[DeviceTemplate] Failed to set active template:', err);
    }
    
    console.log('[DeviceTemplate] Created template:', newTemplate.id);
    return newTemplate;
  }, [templates]);

  const updateTemplate = useCallback(async (id: string, updates: Partial<DeviceTemplate>) => {
    console.log('[DeviceTemplate] Updating template:', id);
    
    if (!id || typeof id !== 'string') {
      const appError = createAppError(ErrorCode.INVALID_INPUT, 'Invalid template ID');
      setError(appError);
      throw new Error(appError.message);
    }
    
    const templateExists = templates.some(t => t.id === id);
    if (!templateExists) {
      const appError = createAppError(ErrorCode.TEMPLATE_NOT_FOUND, `Template not found: ${id}`);
      setError(appError);
      throw new Error(appError.message);
    }
    
    if (updates.name) {
      const nameValidation = validateTemplateName(updates.name);
      if (!nameValidation.valid) {
        const appError = createAppError(ErrorCode.INVALID_INPUT, nameValidation.error || 'Invalid template name');
        setError(appError);
        throw new Error(nameValidation.error);
      }
    }
    
    const newTemplates = templates.map(t => 
      t.id === id 
        ? { ...t, ...updates, updatedAt: new Date().toISOString() }
        : t
    );
    
    await saveTemplates(newTemplates);
    console.log('[DeviceTemplate] Updated template:', id);
  }, [templates]);

  const deleteTemplate = useCallback(async (id: string) => {
    console.log('[DeviceTemplate] Deleting template:', id);
    
    if (!id || typeof id !== 'string') {
      const appError = createAppError(ErrorCode.INVALID_INPUT, 'Invalid template ID');
      setError(appError);
      throw new Error(appError.message);
    }
    
    const newTemplates = templates.filter(t => t.id !== id);
    
    if (newTemplates.length === templates.length) {
      console.warn('[DeviceTemplate] Template not found for deletion:', id);
    }
    
    const saved = await saveTemplates(newTemplates);
    if (!saved) {
      throw new Error('Failed to delete template');
    }
    
    if (activeTemplateId === id) {
      const newActiveId = newTemplates.length > 0 ? newTemplates[0].id : null;
      setActiveTemplateId(newActiveId);
      try {
        if (newActiveId) {
          await AsyncStorage.setItem(ACTIVE_TEMPLATE_KEY, newActiveId);
        } else {
          await AsyncStorage.removeItem(ACTIVE_TEMPLATE_KEY);
        }
      } catch (err) {
        console.error('[DeviceTemplate] Failed to update active template after deletion:', err);
      }
    }
    console.log('[DeviceTemplate] Deleted template:', id);
  }, [templates, activeTemplateId]);

  const setActiveTemplate = useCallback(async (id: string | null) => {
    console.log('[DeviceTemplate] Setting active template:', id);
    
    if (id !== null && typeof id !== 'string') {
      console.error('[DeviceTemplate] Invalid template ID type');
      return;
    }
    
    if (id !== null && !templates.some(t => t.id === id)) {
      console.warn('[DeviceTemplate] Template not found:', id);
    }
    
    setActiveTemplateId(id);
    try {
      if (id) {
        await AsyncStorage.setItem(ACTIVE_TEMPLATE_KEY, id);
      } else {
        await AsyncStorage.removeItem(ACTIVE_TEMPLATE_KEY);
      }
    } catch (err) {
      console.error('[DeviceTemplate] Failed to persist active template:', err);
    }
    console.log('[DeviceTemplate] Active template set to:', id);
  }, [templates]);

  const updateCaptureDevice = useCallback(async (templateId: string, deviceId: string, updates: Partial<CaptureDevice>) => {
    console.log('[DeviceTemplate] Updating capture device:', deviceId, 'in template:', templateId);
    
    if (!templateId || !deviceId) {
      const appError = createAppError(ErrorCode.INVALID_INPUT, 'Template ID and Device ID are required');
      setError(appError);
      throw new Error(appError.message);
    }
    
    const template = templates.find(t => t.id === templateId);
    if (!template) {
      const appError = createAppError(ErrorCode.TEMPLATE_NOT_FOUND, `Template not found: ${templateId}`);
      setError(appError);
      throw new Error(appError.message);
    }
    
    const device = template.captureDevices.find(d => d.id === deviceId);
    if (!device) {
      const appError = createAppError(ErrorCode.DEVICE_NOT_FOUND, `Device not found: ${deviceId}`);
      setError(appError);
      throw new Error(appError.message);
    }
    
    const newTemplates = templates.map(t => {
      if (t.id !== templateId) return t;
      return {
        ...t,
        updatedAt: new Date().toISOString(),
        captureDevices: t.captureDevices.map(d =>
          d.id === deviceId ? { ...d, ...updates } : d
        ),
      };
    });
    await saveTemplates(newTemplates);
  }, [templates]);

  const assignVideoToDevice = useCallback(async (templateId: string, deviceId: string, videoUri: string, videoName: string, autoEnableSim: boolean = false) => {
    console.log('[DeviceTemplate] Assigning video to device:', deviceId, 'autoEnableSim:', autoEnableSim);
    
    if (!videoUri || typeof videoUri !== 'string') {
      const appError = createAppError(ErrorCode.INVALID_INPUT, 'Video URI is required');
      setError(appError);
      throw new Error(appError.message);
    }
    
    if (!videoName || typeof videoName !== 'string') {
      const appError = createAppError(ErrorCode.INVALID_INPUT, 'Video name is required');
      setError(appError);
      throw new Error(appError.message);
    }
    
    const normalizedUri = formatVideoUriForWebView(videoUri.trim());
    const updates: Partial<CaptureDevice> = {
      assignedVideoUri: normalizedUri,
      assignedVideoName: videoName.trim(),
    };
    
    if (autoEnableSim) {
      updates.simulationEnabled = true;
    }
    
    await updateCaptureDevice(templateId, deviceId, updates);
    console.log('[DeviceTemplate] Video assigned successfully, simulation:', autoEnableSim ? 'enabled' : 'unchanged');
  }, [updateCaptureDevice]);

  const clearVideoFromDevice = useCallback(async (templateId: string, deviceId: string) => {
    console.log('[DeviceTemplate] Clearing video from device:', deviceId);
    
    await updateCaptureDevice(templateId, deviceId, {
      assignedVideoUri: undefined,
      assignedVideoName: undefined,
      simulationEnabled: false,
    });
    console.log('[DeviceTemplate] Video cleared successfully');
  }, [updateCaptureDevice]);

  const toggleDeviceSimulation = useCallback(async (templateId: string, deviceId: string) => {
    console.log('[DeviceTemplate] Toggling simulation for device:', deviceId);
    
    const template = templates.find(t => t.id === templateId);
    if (!template) {
      const appError = createAppError(ErrorCode.TEMPLATE_NOT_FOUND, `Template not found: ${templateId}`);
      setError(appError);
      throw new Error(appError.message);
    }
    
    const device = template.captureDevices.find(d => d.id === deviceId);
    if (!device) {
      const appError = createAppError(ErrorCode.DEVICE_NOT_FOUND, `Device not found: ${deviceId}`);
      setError(appError);
      throw new Error(appError.message);
    }
    
    if (!device.assignedVideoUri && !device.simulationEnabled) {
      console.warn('[DeviceTemplate] Cannot enable simulation without assigned video');
      return;
    }
    
    await updateCaptureDevice(templateId, deviceId, {
      simulationEnabled: !device.simulationEnabled,
    });
    console.log('[DeviceTemplate] Simulation toggled for device:', deviceId);
  }, [templates, updateCaptureDevice]);

  const assignVideoToAllDevices = useCallback(async (templateId: string, videoUri: string, videoName: string, deviceType?: 'camera' | 'microphone', autoEnableSim: boolean = false) => {
    console.log('[DeviceTemplate] Assigning video to all devices:', videoUri, 'autoEnableSim:', autoEnableSim);
    
    const template = templates.find(t => t.id === templateId);
    if (!template) {
      const appError = createAppError(ErrorCode.TEMPLATE_NOT_FOUND, `Template not found: ${templateId}`);
      setError(appError);
      throw new Error(appError.message);
    }
    
    const devicesToUpdate = template.captureDevices.filter(d => 
      deviceType ? d.type === deviceType : d.type === 'camera'
    );
    
    const normalizedUri = formatVideoUriForWebView(videoUri.trim());
    
    const newTemplates = templates.map(t => {
      if (t.id !== templateId) return t;
      return {
        ...t,
        updatedAt: new Date().toISOString(),
        captureDevices: t.captureDevices.map(d => {
          if (devicesToUpdate.some(du => du.id === d.id)) {
            return {
              ...d,
              assignedVideoUri: normalizedUri,
              assignedVideoName: videoName.trim(),
              simulationEnabled: autoEnableSim ? true : d.simulationEnabled,
            };
          }
          return d;
        }),
      };
    });
    
    await saveTemplates(newTemplates);
    console.log('[DeviceTemplate] Video assigned to', devicesToUpdate.length, 'devices, simulation:', autoEnableSim ? 'enabled' : 'unchanged');
  }, [templates]);

  const toggleStealthMode = useCallback(async () => {
    const newValue = !stealthMode;
    setStealthMode(newValue);
    try {
      await AsyncStorage.setItem(STEALTH_MODE_KEY, String(newValue));
      console.log('[DeviceTemplate] Stealth mode toggled:', newValue);
    } catch (err) {
      console.error('[DeviceTemplate] Failed to save stealth mode:', err);
    }
  }, [stealthMode]);

  const updateCameraStatus = useCallback((deviceId: string, status: Partial<ActiveCameraStatus>) => {
    setActiveCameras(prev => {
      const existing = prev.find(c => c.deviceId === deviceId);
      if (existing) {
        return prev.map(c => c.deviceId === deviceId ? { ...c, ...status } : c);
      }
      return [...prev, { deviceId, isActive: false, isSimulating: false, ...status }];
    });
  }, []);

  const clearAllCameraStatus = useCallback(() => {
    setActiveCameras([]);
  }, []);

  const extractBaseUrl = useCallback((url: string): string => {
    try {
      const parsed = new URL(url);
      return parsed.hostname;
    } catch {
      return url;
    }
  }, []);

  const getWebsiteSettings = useCallback((url: string): WebsiteSettings | null => {
    const baseUrl = extractBaseUrl(url);
    const exactMatch = websiteSettings.find(s => s.fullUrl === url);
    if (exactMatch) return exactMatch;
    
    const subdomainMatch = websiteSettings.find(s => 
      s.applyToSubdomains && baseUrl.endsWith(s.baseUrl)
    );
    if (subdomainMatch) return subdomainMatch;
    
    const baseMatch = websiteSettings.find(s => s.baseUrl === baseUrl);
    return baseMatch || null;
  }, [websiteSettings, extractBaseUrl]);

  const saveWebsiteSettings = useCallback(async (url: string, settings: { useStealthByDefault: boolean; applyToSubdomains: boolean }) => {
    const baseUrl = extractBaseUrl(url);
    const now = new Date().toISOString();
    
    const existing = websiteSettings.find(s => s.baseUrl === baseUrl);
    let newSettings: WebsiteSettings[];
    
    if (existing) {
      newSettings = websiteSettings.map(s => 
        s.id === existing.id 
          ? { ...s, ...settings, updatedAt: now }
          : s
      );
    } else {
      const newSetting: WebsiteSettings = {
        id: `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        baseUrl,
        fullUrl: url,
        ...settings,
        createdAt: now,
        updatedAt: now,
      };
      newSettings = [...websiteSettings, newSetting];
    }
    
    setWebsiteSettings(newSettings);
    await AsyncStorage.setItem(WEBSITE_SETTINGS_KEY, JSON.stringify(newSettings));
    console.log('[DeviceTemplate] Saved website settings for:', baseUrl);
  }, [websiteSettings, extractBaseUrl]);

  const deleteWebsiteSettings = useCallback(async (id: string) => {
    const newSettings = websiteSettings.filter(s => s.id !== id);
    setWebsiteSettings(newSettings);
    await AsyncStorage.setItem(WEBSITE_SETTINGS_KEY, JSON.stringify(newSettings));
    console.log('[DeviceTemplate] Deleted website settings:', id);
  }, [websiteSettings]);

  const shouldUseStealthForUrl = useCallback((url: string): boolean => {
    const settings = getWebsiteSettings(url);
    if (settings) {
      return settings.useStealthByDefault;
    }
    // Default to true for all websites - stealth mode on by default
    return true;
  }, [getWebsiteSettings]);

  const activeTemplate = templates.find(t => t.id === activeTemplateId) || null;
  const hasCompletedSetup = templates.some(t => t.isComplete);
  const hasMatchingTemplate = findMatchingTemplate() !== null;

  return {
    templates,
    activeTemplate,
    isLoading,
    hasCompletedSetup,
    hasMatchingTemplate,
    currentDeviceInfo,
    activeCameras,
    stealthMode,
    websiteSettings,
    error,
    clearError,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    setActiveTemplate,
    updateCaptureDevice,
    assignVideoToDevice,
    assignVideoToAllDevices,
    clearVideoFromDevice,
    toggleDeviceSimulation,
    toggleStealthMode,
    retryLoadTemplates: loadTemplates,
    findMatchingTemplate,
    updateCameraStatus,
    clearAllCameraStatus,
    generateTemplateName,
    getWebsiteSettings,
    saveWebsiteSettings,
    deleteWebsiteSettings,
    shouldUseStealthForUrl,
  };
});
