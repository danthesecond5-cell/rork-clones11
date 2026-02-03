import { NativeModules, Platform } from 'react-native';
import Constants from 'expo-constants';

const isExpoGo = Constants.appOwnership === 'expo';
const LoopbackModule = isExpoGo ? null : NativeModules.WebRtcLoopback;

export const exportRingBufferToPhotos = async (): Promise<void> => {
  if (Platform.OS !== 'ios') {
    throw new Error('Ring buffer export is only supported on iOS.');
  }
  if (isExpoGo) {
    throw new Error('Ring buffer export is not available in Expo Go. Please use a development build.');
  }
  if (!LoopbackModule?.exportRingBufferToPhotos) {
    throw new Error('Native WebRtcLoopback module not available.');
  }
  await LoopbackModule.exportRingBufferToPhotos();
};
