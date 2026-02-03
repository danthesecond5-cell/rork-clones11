import { requireNativeModule } from 'expo-modules-core';
import Constants from 'expo-constants';

const isExpoGo = Constants.appOwnership === 'expo';

let NativeMediaBridgeModule;

try {
  if (isExpoGo) {
    throw new Error('Not available in Expo Go');
  }
  NativeMediaBridgeModule = requireNativeModule('NativeMediaBridge');
} catch (error) {
  console.warn('[NativeMediaBridge] Not available - graceful fallback enabled');
  NativeMediaBridgeModule = null;
}

export default NativeMediaBridgeModule;
