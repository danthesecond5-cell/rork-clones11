import Constants from 'expo-constants';

const appOwnership = Constants.appOwnership ?? 'unknown';

// Expo Go reports appOwnership === 'expo'.
export const isExpoGo = appOwnership === 'expo';
export const expoAppOwnership = appOwnership;
