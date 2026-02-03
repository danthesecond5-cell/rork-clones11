import Constants from 'expo-constants';

/**
 * Returns true when running inside the Expo Go client.
 *
 * Prefer `executionEnvironment` (SDK 49+) which distinguishes Expo Go
 * (`storeClient`) from dev-client (`bare`) and standalone (`standalone`).
 */
export function isExpoGo(): boolean {
  try {
    const executionEnvironment = (Constants as any)?.executionEnvironment as string | undefined;
    if (executionEnvironment) {
      return executionEnvironment === 'storeClient';
    }

    // Fallback for older environments.
    const appOwnership = (Constants as any)?.appOwnership as string | undefined;
    return appOwnership === 'expo';
  } catch {
    return false;
  }
}

