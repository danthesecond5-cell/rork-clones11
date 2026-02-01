import { Alert, Platform } from 'react-native';

export enum ErrorCode {
  UNKNOWN = 'UNKNOWN',
  NETWORK = 'NETWORK',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  STORAGE = 'STORAGE',
  SENSOR_UNAVAILABLE = 'SENSOR_UNAVAILABLE',
  CAMERA_ERROR = 'CAMERA_ERROR',
  MICROPHONE_ERROR = 'MICROPHONE_ERROR',
  VIDEO_LOAD_ERROR = 'VIDEO_LOAD_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  TEMPLATE_NOT_FOUND = 'TEMPLATE_NOT_FOUND',
  DEVICE_NOT_FOUND = 'DEVICE_NOT_FOUND',
  WEBVIEW_ERROR = 'WEBVIEW_ERROR',
  // Protocol-specific error codes
  PROTOCOL_INIT_FAILED = 'PROTOCOL_INIT_FAILED',
  PROTOCOL_CONFIG_INVALID = 'PROTOCOL_CONFIG_INVALID',
  PROTOCOL_INJECTION_FAILED = 'PROTOCOL_INJECTION_FAILED',
  PROTOCOL_STREAM_ERROR = 'PROTOCOL_STREAM_ERROR',
  PROTOCOL_RECOVERY_FAILED = 'PROTOCOL_RECOVERY_FAILED',
  PROTOCOL_STEALTH_COMPROMISED = 'PROTOCOL_STEALTH_COMPROMISED',
  PROTOCOL_QUALITY_DEGRADED = 'PROTOCOL_QUALITY_DEGRADED',
  PROTOCOL_TIMEOUT = 'PROTOCOL_TIMEOUT',
  ALLOWLIST_BLOCKED = 'ALLOWLIST_BLOCKED',
  BODY_DETECTION_FAILED = 'BODY_DETECTION_FAILED',
  CLAUDE_PROTOCOL_ERROR = 'CLAUDE_PROTOCOL_ERROR',
}

export interface AppError {
  code: ErrorCode;
  message: string;
  originalError?: Error | unknown;
  recoverable: boolean;
  timestamp: string;
}

const DEFAULT_ERROR_MESSAGE = 'An unexpected error occurred';
const NETWORK_ERROR_CODES = new Set([
  'econnrefused',
  'econnreset',
  'econnaborted',
  'enotfound',
  'enetunreach',
  'ehostunreach',
  'eai_again',
  'err_network',
  'err_internet_disconnected',
  'etimedout',
]);
const NETWORK_ERROR_NAMES = new Set(['aborterror', 'networkerror']);
const PERMISSION_ERROR_CODES = new Set(['eacces', 'eperm']);
const PERMISSION_ERROR_NAMES = new Set([
  'notallowederror',
  'permissiondeniederror',
  'securityerror',
  'notauthorizederror',
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object';

const normalizeMessage = (value: unknown): string | null => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }
  if (typeof value === 'symbol') {
    return value.toString();
  }
  return null;
};

const safeSerialize = (value: unknown): string | null => {
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
};

const getErrorName = (error: unknown): string => {
  if (error instanceof Error) {
    return normalizeMessage(error.name) || '';
  }
  if (isRecord(error) && typeof error.name === 'string') {
    return error.name;
  }
  return '';
};

const getErrorCode = (error: unknown): string => {
  if (isRecord(error) && (typeof error.code === 'string' || typeof error.code === 'number')) {
    return String(error.code);
  }
  return '';
};

export function isAppError(error: unknown): error is AppError {
  return (
    isRecord(error) &&
    typeof error.code === 'string' &&
    typeof error.message === 'string' &&
    typeof error.recoverable === 'boolean' &&
    typeof error.timestamp === 'string'
  );
}

export function createAppError(
  code: ErrorCode,
  message: string,
  originalError?: Error | unknown,
  recoverable = true
): AppError {
  const normalizedMessage =
    normalizeMessage(message) ||
    (originalError ? getErrorMessage(originalError) : null) ||
    DEFAULT_ERROR_MESSAGE;
  const timestamp = new Date().toISOString();
  const error: AppError = {
    code,
    message: normalizedMessage,
    originalError,
    recoverable,
    timestamp,
  };
  
  console.error(`[AppError] ${code}: ${normalizedMessage}`, {
    originalError,
    timestamp,
  });
  
  return error;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const message = normalizeMessage(error.message);
    if (message) return message;
    const name = normalizeMessage(error.name);
    if (name) return name;
  }

  const primitiveMessage = normalizeMessage(error);
  if (primitiveMessage) {
    return primitiveMessage;
  }

  if (isRecord(error)) {
    const message =
      normalizeMessage(error.message) ||
      normalizeMessage(error.error) ||
      normalizeMessage(error.reason);
    if (message) return message;

    if (error.message !== undefined) {
      const serializedMessage = safeSerialize(error.message);
      if (serializedMessage) return serializedMessage;
    }

    if (error.error instanceof Error) {
      const nestedMessage = normalizeMessage(error.error.message) || normalizeMessage(error.error.name);
      if (nestedMessage) return nestedMessage;
    }

    if (error.reason instanceof Error) {
      const nestedMessage = normalizeMessage(error.reason.message) || normalizeMessage(error.reason.name);
      if (nestedMessage) return nestedMessage;
    }

    const serialized = safeSerialize(error);
    if (serialized) return serialized;
  }

  return DEFAULT_ERROR_MESSAGE;
}

export function isNetworkError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();
  const code = getErrorCode(error).toLowerCase();
  const name = getErrorName(error).toLowerCase();
  const messageHints = [
    'network',
    'fetch',
    'connection',
    'timeout',
    'offline',
    'socket hang up',
    'failed to fetch',
    'load failed',
  ];

  if (NETWORK_ERROR_CODES.has(code)) return true;
  if (NETWORK_ERROR_NAMES.has(name)) return true;
  if (name === 'typeerror' && (message.includes('fetch') || message.includes('network'))) return true;

  return messageHints.some((hint) => message.includes(hint));
}

export function isPermissionError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();
  const code = getErrorCode(error).toLowerCase();
  const name = getErrorName(error).toLowerCase();
  const messageHints = [
    'permission',
    'denied',
    'not allowed',
    'not authorized',
    'unauthorized',
    'forbidden',
    'blocked',
    'disallowed',
    'access',
  ];

  if (PERMISSION_ERROR_CODES.has(code)) return true;
  if (PERMISSION_ERROR_NAMES.has(name)) return true;

  return messageHints.some((hint) => message.includes(hint));
}

export function handleAsyncError<T>(
  promise: Promise<T>,
  errorCode: ErrorCode = ErrorCode.UNKNOWN
): Promise<[T | null, AppError | null]> {
  return promise
    .then((data) => [data, null] as [T, null])
    .catch((error) => {
      const appError = isAppError(error)
        ? error
        : createAppError(
            errorCode,
            getErrorMessage(error),
            error
          );
      return [null, appError] as [null, AppError];
    });
}

export function showErrorAlert(
  title: string,
  message: string,
  onRetry?: () => void,
  onCancel?: () => void
): void {
  const safeTitle = title.trim() || 'Error';
  const safeMessage = message.trim() || DEFAULT_ERROR_MESSAGE;
  const buttons: { text: string; onPress?: () => void; style?: 'cancel' | 'default' | 'destructive' }[] = [];
  
  if (onCancel) {
    buttons.push({
      text: 'Cancel',
      style: 'cancel',
      onPress: onCancel,
    });
  }
  
  if (onRetry) {
    buttons.push({
      text: 'Retry',
      onPress: onRetry,
    });
  }
  
  if (buttons.length === 0) {
    buttons.push({ text: 'OK' });
  }
  
  Alert.alert(safeTitle, safeMessage, buttons);
}

export function validateUrl(url: string): { valid: boolean; error?: string } {
  if (typeof url !== 'string') {
    return { valid: false, error: 'URL is required' };
  }
  
  const trimmed = url.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'URL cannot be empty' };
  }
  
  if (trimmed.length > 2048) {
    return { valid: false, error: 'URL is too long' };
  }
  
  try {
    new URL(trimmed);
    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

export function validateVideoUrl(url: string): { valid: boolean; error?: string } {
  const urlValidation = validateUrl(url);
  if (!urlValidation.valid) {
    return urlValidation;
  }
  
  const normalizedUrl = url.trim();
  const supportedExtensions = ['.mp4', '.webm', '.mov', '.m4v', '.avi'];
  const hasValidExtension = supportedExtensions.some(ext => 
    normalizedUrl.toLowerCase().includes(ext)
  );
  
  if (!hasValidExtension && !normalizedUrl.includes('blob:') && !normalizedUrl.includes('data:')) {
    console.warn('[Validation] Video URL may not have a recognized video extension:', normalizedUrl);
  }
  
  return { valid: true };
}

export function validateTemplateName(name: string): { valid: boolean; error?: string } {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Template name is required' };
  }
  
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'Template name cannot be empty' };
  }
  
  if (trimmed.length < 2) {
    return { valid: false, error: 'Template name must be at least 2 characters' };
  }
  
  if (trimmed.length > 100) {
    return { valid: false, error: 'Template name must be less than 100 characters' };
  }
  
  return { valid: true };
}

export function safeJsonParse<T>(json: string | null | undefined, fallback: T): T {
  if (typeof json !== 'string') {
    return fallback;
  }
  const trimmed = json.trim();
  if (trimmed.length === 0) {
    return fallback;
  }
  try {
    return JSON.parse(trimmed) as T;
  } catch (error) {
    console.error('[SafeJsonParse] Failed to parse JSON:', error);
    return fallback;
  }
}

export function safeJsonStringify(data: unknown): string | null {
  try {
    const result = JSON.stringify(data);
    if (typeof result !== 'string') {
      return null;
    }
    return result;
  } catch (error) {
    console.error('[SafeJsonStringify] Failed to stringify data:', error);
    return null;
  }
}

export function withErrorLogging<T extends (...args: unknown[]) => unknown>(
  fn: T,
  context: string
): T {
  return (function (this: unknown, ...args: Parameters<T>) {
    try {
      const result = fn.apply(this, args);
      if (result && typeof (result as Promise<unknown>).then === 'function') {
        return (result as Promise<unknown>).catch((error: unknown) => {
          console.error(`[${context}] Async error:`, error);
          throw error;
        });
      }
      return result;
    } catch (error) {
      console.error(`[${context}] Sync error:`, error);
      throw error;
    }
  }) as T;
}

export function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 1000
): Promise<T> {
  return new Promise((resolve, reject) => {
    const normalizedMaxRetries = Number.isFinite(maxRetries) ? Math.max(0, Math.floor(maxRetries)) : 0;
    const baseDelay = Number.isFinite(initialDelay) ? Math.max(0, initialDelay) : 0;
    let retries = 0;
    
    const attempt = async () => {
      try {
        const result = await fn();
        resolve(result);
      } catch (error) {
        retries++;
        console.log(`[RetryWithBackoff] Attempt ${retries}/${normalizedMaxRetries} failed:`, error);
        
        if (retries >= normalizedMaxRetries) {
          reject(error);
          return;
        }
        
        const delay = baseDelay * Math.pow(2, retries - 1);
        console.log(`[RetryWithBackoff] Retrying in ${delay}ms...`);
        setTimeout(attempt, delay);
      }
    };
    
    attempt();
  });
}

export function debounceError(
  fn: (error: AppError) => void,
  delay = 1000
): (error: AppError) => void {
  let lastError: string | null = null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const delayMs = Number.isFinite(delay) ? Math.max(0, delay) : 0;
  
  return (error: AppError) => {
    const errorKey = `${error.code}:${error.message}`;
    
    if (errorKey === lastError) {
      return;
    }
    
    lastError = errorKey;
    fn(error);
    
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      lastError = null;
    }, delayMs);
  };
}

export function getPlatformSpecificError(error: unknown): string {
  const baseMessage = getErrorMessage(error);
  
  if (Platform.OS === 'web') {
    const normalizedMessage = baseMessage.toLowerCase();
    if (normalizedMessage.includes('getusermedia')) {
      return 'Camera/microphone access is not available in this browser. Please use a mobile device.';
    }
    if (normalizedMessage.includes('devicemotion') || normalizedMessage.includes('device motion')) {
      return 'Motion sensors are not available in this browser. Please use a mobile device.';
    }
  }
  
  return baseMessage;
}

// ============ PROTOCOL-SPECIFIC ERROR HANDLING ============

/**
 * Protocol Error Details Interface
 */
export interface ProtocolErrorDetails {
  protocolId?: string;
  phase?: 'init' | 'injection' | 'streaming' | 'recovery' | 'cleanup';
  component?: string;
  metrics?: Record<string, unknown>;
  recoveryAttempts?: number;
  timestamp: number;
}

/**
 * Extended Protocol Error
 */
export interface ProtocolError extends AppError {
  protocolDetails?: ProtocolErrorDetails;
}

/**
 * Create a protocol-specific error
 */
export function createProtocolError(
  code: ErrorCode,
  message: string,
  protocolDetails: Omit<ProtocolErrorDetails, 'timestamp'>,
  originalError?: Error | unknown
): ProtocolError {
  const baseError = createAppError(code, message, originalError);
  
  return {
    ...baseError,
    protocolDetails: {
      ...protocolDetails,
      timestamp: Date.now(),
    },
  };
}

/**
 * Check if error is a protocol error
 */
export function isProtocolError(error: unknown): error is ProtocolError {
  return isAppError(error) && 'protocolDetails' in error;
}

/**
 * Protocol error recovery strategies
 */
export type RecoveryStrategy = 
  | 'retry'
  | 'fallback'
  | 'degraded_mode'
  | 'switch_protocol'
  | 'restart'
  | 'abort';

/**
 * Get recommended recovery strategy for protocol errors
 */
export function getProtocolRecoveryStrategy(error: ProtocolError): {
  strategy: RecoveryStrategy;
  canAutoRecover: boolean;
  message: string;
} {
  switch (error.code) {
    case ErrorCode.PROTOCOL_INIT_FAILED:
      return {
        strategy: 'retry',
        canAutoRecover: true,
        message: 'Protocol initialization failed. Retrying...',
      };
    
    case ErrorCode.PROTOCOL_INJECTION_FAILED:
      return {
        strategy: 'fallback',
        canAutoRecover: true,
        message: 'Injection failed. Switching to fallback mode...',
      };
    
    case ErrorCode.PROTOCOL_STREAM_ERROR:
      const attempts = error.protocolDetails?.recoveryAttempts || 0;
      if (attempts < 3) {
        return {
          strategy: 'retry',
          canAutoRecover: true,
          message: `Stream error. Recovery attempt ${attempts + 1}...`,
        };
      }
      return {
        strategy: 'degraded_mode',
        canAutoRecover: true,
        message: 'Multiple stream errors. Switching to degraded mode...',
      };
    
    case ErrorCode.PROTOCOL_RECOVERY_FAILED:
      return {
        strategy: 'switch_protocol',
        canAutoRecover: false,
        message: 'Recovery failed. Manual intervention may be required.',
      };
    
    case ErrorCode.PROTOCOL_STEALTH_COMPROMISED:
      return {
        strategy: 'abort',
        canAutoRecover: false,
        message: 'Stealth mode compromised. Stopping to prevent detection.',
      };
    
    case ErrorCode.PROTOCOL_QUALITY_DEGRADED:
      return {
        strategy: 'degraded_mode',
        canAutoRecover: true,
        message: 'Quality degradation detected. Adjusting settings...',
      };
    
    case ErrorCode.PROTOCOL_TIMEOUT:
      return {
        strategy: 'retry',
        canAutoRecover: true,
        message: 'Operation timed out. Retrying with extended timeout...',
      };
    
    case ErrorCode.ALLOWLIST_BLOCKED:
      return {
        strategy: 'abort',
        canAutoRecover: false,
        message: 'Domain not in allowlist. Injection blocked.',
      };
    
    case ErrorCode.BODY_DETECTION_FAILED:
      return {
        strategy: 'fallback',
        canAutoRecover: true,
        message: 'Body detection failed. Using fallback replacement...',
      };
    
    case ErrorCode.CLAUDE_PROTOCOL_ERROR:
      return {
        strategy: 'switch_protocol',
        canAutoRecover: true,
        message: 'Claude protocol error. Switching to standard protocol...',
      };
    
    default:
      return {
        strategy: 'retry',
        canAutoRecover: error.recoverable,
        message: 'An error occurred. Attempting recovery...',
      };
  }
}

/**
 * Format protocol error for display
 */
export function formatProtocolError(error: ProtocolError): string {
  const parts: string[] = [];
  
  // Add protocol info
  if (error.protocolDetails?.protocolId) {
    parts.push(`[${error.protocolDetails.protocolId.toUpperCase()}]`);
  }
  
  // Add phase info
  if (error.protocolDetails?.phase) {
    parts.push(`(${error.protocolDetails.phase})`);
  }
  
  // Add message
  parts.push(error.message);
  
  return parts.join(' ');
}

/**
 * Log protocol error with full context
 */
export function logProtocolError(error: ProtocolError, additionalContext?: Record<string, unknown>): void {
  const logData = {
    code: error.code,
    message: error.message,
    recoverable: error.recoverable,
    protocolDetails: error.protocolDetails,
    timestamp: error.timestamp,
    ...additionalContext,
  };
  
  console.error('[ProtocolError]', formatProtocolError(error), logData);
  
  // In production, this could send to analytics
  if (typeof window !== 'undefined' && (window as any).ReactNativeWebView) {
    try {
      (window as any).ReactNativeWebView.postMessage(JSON.stringify({
        type: 'protocolError',
        payload: logData,
      }));
    } catch {
      // Silently fail if WebView posting fails
    }
  }
}

/**
 * Create error boundary handler for protocol components
 */
export function createProtocolErrorBoundaryHandler(
  protocolId: string,
  onError?: (error: ProtocolError) => void,
  onRecovery?: (strategy: RecoveryStrategy) => void
): (error: Error, errorInfo?: { componentStack?: string }) => void {
  return (error: Error, errorInfo?: { componentStack?: string }) => {
    const protocolError = createProtocolError(
      ErrorCode.PROTOCOL_INJECTION_FAILED,
      error.message,
      {
        protocolId,
        phase: 'streaming',
        component: errorInfo?.componentStack?.split('\n')[1]?.trim(),
      },
      error
    );
    
    logProtocolError(protocolError, { componentStack: errorInfo?.componentStack });
    
    if (onError) {
      onError(protocolError);
    }
    
    const { strategy, canAutoRecover } = getProtocolRecoveryStrategy(protocolError);
    
    if (canAutoRecover && onRecovery) {
      onRecovery(strategy);
    }
  };
}

/**
 * Wrap async protocol operation with error handling
 */
export async function withProtocolErrorHandling<T>(
  protocolId: string,
  phase: ProtocolErrorDetails['phase'],
  operation: () => Promise<T>,
  options?: {
    fallback?: T;
    maxRetries?: number;
    onError?: (error: ProtocolError) => void;
  }
): Promise<T> {
  const { fallback, maxRetries = 3, onError } = options || {};
  let lastError: ProtocolError | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = createProtocolError(
        ErrorCode.PROTOCOL_INJECTION_FAILED,
        getErrorMessage(error),
        {
          protocolId,
          phase,
          recoveryAttempts: attempt + 1,
        },
        error
      );
      
      logProtocolError(lastError);
      
      if (onError) {
        onError(lastError);
      }
      
      // Exponential backoff
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 500));
      }
    }
  }
  
  if (fallback !== undefined) {
    console.warn(`[ProtocolErrorHandling] Using fallback for ${protocolId}/${phase}`);
    return fallback;
  }
  
  throw lastError || createProtocolError(
    ErrorCode.PROTOCOL_INJECTION_FAILED,
    'Operation failed after all retries',
    { protocolId, phase }
  );
}

/**
 * Check if error should trigger protocol switch
 */
export function shouldSwitchProtocol(error: ProtocolError): boolean {
  const criticalCodes = new Set([
    ErrorCode.PROTOCOL_RECOVERY_FAILED,
    ErrorCode.PROTOCOL_STEALTH_COMPROMISED,
    ErrorCode.CLAUDE_PROTOCOL_ERROR,
  ]);
  
  return criticalCodes.has(error.code) || (error.protocolDetails?.recoveryAttempts || 0) >= 5;
}

/**
 * Get fallback protocol for a failed protocol
 */
export function getFallbackProtocol(failedProtocolId: string): string {
  const fallbackMap: Record<string, string> = {
    claude: 'standard',
    protected: 'standard',
    harness: 'standard',
    allowlist: 'standard',
    standard: 'harness', // Ultimate fallback
  };
  
  return fallbackMap[failedProtocolId] || 'standard';
}
