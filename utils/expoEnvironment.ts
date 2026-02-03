import Constants from 'expo-constants';

const appOwnership = Constants.appOwnership ?? 'unknown';

export const IS_EXPO_GO = appOwnership === 'expo';
export const IS_DEV_CLIENT = appOwnership === 'guest';
export const IS_STANDALONE = appOwnership === 'standalone';
export const SUPPORTS_CUSTOM_NATIVE_MODULES = appOwnership !== 'expo';
export const EXPO_RUNTIME = appOwnership;
