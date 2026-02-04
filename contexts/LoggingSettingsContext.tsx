import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateLoggingSettings as updateConfigurableLogger } from '@/utils/configurableLogger';

interface LoggingSettings {
  consoleWarningsEnabled: boolean;
  consoleErrorsEnabled: boolean;
  consoleLogsEnabled: boolean;
  protocolLogsEnabled: boolean;
}

interface LoggingSettingsContextValue {
  settings: LoggingSettings;
  setConsoleWarningsEnabled: (enabled: boolean) => Promise<void>;
  setConsoleErrorsEnabled: (enabled: boolean) => Promise<void>;
  setConsoleLogsEnabled: (enabled: boolean) => Promise<void>;
  setProtocolLogsEnabled: (enabled: boolean) => Promise<void>;
  resetToDefaults: () => Promise<void>;
}

const DEFAULT_SETTINGS: LoggingSettings = {
  consoleWarningsEnabled: true,
  consoleErrorsEnabled: true,
  consoleLogsEnabled: true,
  protocolLogsEnabled: true,
};

const STORAGE_KEY = '@logging_settings';

const LoggingSettingsContext = createContext<LoggingSettingsContextValue | null>(null);

export function LoggingSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<LoggingSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const newSettings = { ...DEFAULT_SETTINGS, ...parsed };
        setSettings(newSettings);
        // Sync with the configurable logger
        updateConfigurableLogger(newSettings);
      }
    } catch (error) {
      console.error('[LoggingSettings] Failed to load settings:', error);
    }
  };

  const saveSettings = async (newSettings: LoggingSettings) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
      // Sync with the configurable logger
      updateConfigurableLogger(newSettings);
    } catch (error) {
      console.error('[LoggingSettings] Failed to save settings:', error);
    }
  };

  const setConsoleWarningsEnabled = useCallback(async (enabled: boolean) => {
    await saveSettings({ ...settings, consoleWarningsEnabled: enabled });
  }, [settings]);

  const setConsoleErrorsEnabled = useCallback(async (enabled: boolean) => {
    await saveSettings({ ...settings, consoleErrorsEnabled: enabled });
  }, [settings]);

  const setConsoleLogsEnabled = useCallback(async (enabled: boolean) => {
    await saveSettings({ ...settings, consoleLogsEnabled: enabled });
  }, [settings]);

  const setProtocolLogsEnabled = useCallback(async (enabled: boolean) => {
    await saveSettings({ ...settings, protocolLogsEnabled: enabled });
  }, [settings]);

  const resetToDefaults = useCallback(async () => {
    await saveSettings(DEFAULT_SETTINGS);
  }, []);

  return (
    <LoggingSettingsContext.Provider
      value={{
        settings,
        setConsoleWarningsEnabled,
        setConsoleErrorsEnabled,
        setConsoleLogsEnabled,
        setProtocolLogsEnabled,
        resetToDefaults,
      }}
    >
      {children}
    </LoggingSettingsContext.Provider>
  );
}

export function useLoggingSettings() {
  const context = useContext(LoggingSettingsContext);
  if (!context) {
    throw new Error('useLoggingSettings must be used within LoggingSettingsProvider');
  }
  return context;
}
