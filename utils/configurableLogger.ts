/**
 * Configurable Logger
 * 
 * This logger respects user settings for console output.
 * It provides methods that check settings before logging to the console.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

interface LoggingSettings {
  consoleWarningsEnabled: boolean;
  consoleErrorsEnabled: boolean;
  consoleLogsEnabled: boolean;
  protocolLogsEnabled: boolean;
}

const DEFAULT_SETTINGS: LoggingSettings = {
  consoleWarningsEnabled: true,
  consoleErrorsEnabled: true,
  consoleLogsEnabled: true,
  protocolLogsEnabled: true,
};

const STORAGE_KEY = '@logging_settings';

// In-memory cache of settings to avoid async storage reads on every log
let cachedSettings: LoggingSettings = { ...DEFAULT_SETTINGS };
let settingsLoaded = false;

// Load settings from storage
async function loadSettings(): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      cachedSettings = { ...DEFAULT_SETTINGS, ...parsed };
    }
    settingsLoaded = true;
  } catch (error) {
    // Silently fail and use defaults
    settingsLoaded = true;
  }
}

// Initialize settings load
loadSettings();

/**
 * Get current settings (uses cached value)
 */
export function getLoggingSettings(): LoggingSettings {
  return { ...cachedSettings };
}

/**
 * Update cached settings (call this when settings change)
 */
export function updateLoggingSettings(settings: Partial<LoggingSettings>): void {
  cachedSettings = { ...cachedSettings, ...settings };
}

/**
 * Reload settings from storage
 */
export async function reloadLoggingSettings(): Promise<void> {
  await loadSettings();
}

/**
 * Configurable console.log
 */
export function clog(...args: unknown[]): void {
  if (cachedSettings.consoleLogsEnabled) {
    console.log(...args);
  }
}

/**
 * Configurable console.warn
 */
export function cwarn(...args: unknown[]): void {
  if (cachedSettings.consoleWarningsEnabled) {
    console.warn(...args);
  }
}

/**
 * Configurable console.error
 */
export function cerror(...args: unknown[]): void {
  if (cachedSettings.consoleErrorsEnabled) {
    console.error(...args);
  }
}

/**
 * Protocol-specific log (controlled by protocolLogsEnabled setting)
 */
export function plog(...args: unknown[]): void {
  if (cachedSettings.protocolLogsEnabled) {
    console.log(...args);
  }
}

/**
 * Always log (bypasses settings - use for critical messages only)
 */
export function alog(...args: unknown[]): void {
  console.log(...args);
}

/**
 * Create a scoped logger with a prefix
 */
export function createScopedLogger(scope: string) {
  return {
    log: (...args: unknown[]) => clog(`[${scope}]`, ...args),
    warn: (...args: unknown[]) => cwarn(`[${scope}]`, ...args),
    error: (...args: unknown[]) => cerror(`[${scope}]`, ...args),
    protocol: (...args: unknown[]) => plog(`[${scope}]`, ...args),
    always: (...args: unknown[]) => alog(`[${scope}]`, ...args),
  };
}
