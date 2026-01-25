import React, { useEffect } from 'react';
import { render, act } from '@testing-library/react-native';
import { DeveloperModeProvider, useDeveloperMode } from '@/contexts/DeveloperModeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_DEVELOPER_MODE } from '@/types/protocols';

function Consumer({ onReady }: { onReady?: (ctx: any) => void }) {
  const ctx = useDeveloperMode();
  useEffect(() => { onReady && onReady(ctx); }, [ctx, onReady]);
  return null;
}

describe('DeveloperModeContext', () => {
  test('defaults and PIN behavior', async () => {
    let ctxRef: any = null;

    await act(async () => {
      render(
        <DeveloperModeProvider>
          <Consumer onReady={(ctx) => { ctxRef = ctx; }} />
        </DeveloperModeProvider>
      );
    });

    expect(ctxRef).toBeDefined();
    expect(ctxRef.developerMode.enabled).toBe(DEFAULT_DEVELOPER_MODE.enabled);
    expect(ctxRef.developerMode.pinCode).toBe(DEFAULT_DEVELOPER_MODE.pinCode);

    await act(async () => {
      const res = await ctxRef.toggleDeveloperMode('wrong');
      expect(res).toBe(false);
      expect(ctxRef.isDeveloperModeEnabled).toBe(false);
    });

    await act(async () => {
      const res = await ctxRef.toggleDeveloperMode(DEFAULT_DEVELOPER_MODE.pinCode || '');
      expect(res).toBe(true);
      expect(ctxRef.isDeveloperModeEnabled).toBe(true);
    });

    expect(AsyncStorage.setItem).toHaveBeenCalled();
  });
});
