import Constants from 'expo-constants';

type ExpoRuntimeInfo = {
  appOwnership: string | null;
  executionEnvironment: string | null;
  isExpoGo: boolean;
};

const resolvedConstants = (() => {
  try {
    return Constants;
  } catch {
    return null;
  }
})();

export const getExpoRuntimeInfo = (): ExpoRuntimeInfo => {
  const appOwnership = resolvedConstants?.appOwnership ?? null;
  const executionEnvironment = (resolvedConstants as any)?.executionEnvironment ?? null;
  const isExpoGo = appOwnership === 'expo' || executionEnvironment === 'storeClient';
  return { appOwnership, executionEnvironment, isExpoGo };
};

export const isExpoGo = (): boolean => getExpoRuntimeInfo().isExpoGo;
