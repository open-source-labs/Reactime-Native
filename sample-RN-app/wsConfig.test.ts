// sample-RN-app/wsConfig.test.ts
//
// NOTE: Vitest is not yet configured in sample-RN-app/.
// To run these tests, add vitest to devDependencies and create
// a vitest.config.ts here (no jsdom needed — environment: 'node').
//
// WS_URL is evaluated at module load time, so each test must:
//   1. vi.resetModules()   — clear the module cache
//   2. vi.doMock()         — set up mocks BEFORE the import (not hoisted)
//   3. dynamic import()    — re-evaluate wsConfig with the fresh mocks

import { describe, test, expect, vi, beforeEach } from 'vitest';

describe('wsConfig — WS_URL resolution', () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.EXPO_PUBLIC_WS_HOST;
  });

  // --- Priority chain ---

  test('env var takes priority over all other resolution methods', async () => {
    process.env.EXPO_PUBLIC_WS_HOST = '192.168.1.100';

    vi.doMock('react-native', () => ({ Platform: { OS: 'ios' } }));
    vi.doMock('expo-constants', () => ({
      default: { expoConfig: { hostUri: '10.0.0.1:8081' } },
    }));

    const { WS_URL } = await import('./wsConfig');
    expect(WS_URL).toBe('ws://192.168.1.100:8080');
  });

  test('uses Expo hostUri and strips port when env var is not set', async () => {
    vi.doMock('react-native', () => ({ Platform: { OS: 'ios' } }));
    vi.doMock('expo-constants', () => ({
      default: { expoConfig: { hostUri: '192.168.1.50:8081' } },
    }));

    const { WS_URL } = await import('./wsConfig');
    expect(WS_URL).toBe('ws://192.168.1.50:8080');
  });

  test('uses 10.0.2.2 on Android when no env var or hostUri', async () => {
    vi.doMock('react-native', () => ({ Platform: { OS: 'android' } }));
    vi.doMock('expo-constants', () => ({
      default: { expoConfig: {} },
    }));

    const { WS_URL } = await import('./wsConfig');
    expect(WS_URL).toBe('ws://10.0.2.2:8080');
  });

  test('falls back to localhost on iOS when no env var or hostUri', async () => {
    vi.doMock('react-native', () => ({ Platform: { OS: 'ios' } }));
    vi.doMock('expo-constants', () => ({
      default: { expoConfig: {} },
    }));

    const { WS_URL } = await import('./wsConfig');
    expect(WS_URL).toBe('ws://localhost:8080');
  });

  // --- Contract shape ---

  test('WS_URL is always formatted as ws://<host>:8080', async () => {
    process.env.EXPO_PUBLIC_WS_HOST = 'myhost';
    vi.doMock('react-native', () => ({ Platform: { OS: 'ios' } }));
    vi.doMock('expo-constants', () => ({ default: { expoConfig: {} } }));

    const { WS_URL } = await import('./wsConfig');
    expect(WS_URL).toMatch(/^ws:\/\/.+:8080$/);
  });

  test('handles missing expoConfig gracefully (no crash)', async () => {
    vi.doMock('react-native', () => ({ Platform: { OS: 'ios' } }));
    vi.doMock('expo-constants', () => ({
      default: { expoConfig: null },
    }));

    const { WS_URL } = await import('./wsConfig');
    expect(WS_URL).toBe('ws://localhost:8080');
  });

  // --- Shift-left: silent failure modes ---

  test('does not produce ws://undefined:8080 when hostUri is missing', async () => {
    vi.doMock('react-native', () => ({ Platform: { OS: 'ios' } }));
    vi.doMock('expo-constants', () => ({
      default: { expoConfig: { hostUri: undefined } },
    }));

    const { WS_URL } = await import('./wsConfig');
    expect(WS_URL).not.toContain('undefined');
    expect(WS_URL).toBe('ws://localhost:8080');
  });

  test('does not produce ws://:8080 when env var is set to empty string', async () => {
    process.env.EXPO_PUBLIC_WS_HOST = '';

    vi.doMock('react-native', () => ({ Platform: { OS: 'ios' } }));
    vi.doMock('expo-constants', () => ({
      default: { expoConfig: {} },
    }));

    const { WS_URL } = await import('./wsConfig');
    expect(WS_URL).not.toBe('ws://:8080');
    expect(WS_URL).toBe('ws://localhost:8080');
  });

  test('does not double-wrap scheme when env var includes ws:// prefix', async () => {
    process.env.EXPO_PUBLIC_WS_HOST = 'ws://192.168.1.1';

    vi.doMock('react-native', () => ({ Platform: { OS: 'ios' } }));
    vi.doMock('expo-constants', () => ({
      default: { expoConfig: {} },
    }));

    const { WS_URL } = await import('./wsConfig');
    expect(WS_URL).not.toContain('ws://ws://');
  });

  test('does not embed a port from env var into WS_URL twice when env var includes a port', async () => {
    process.env.EXPO_PUBLIC_WS_HOST = '192.168.1.1:9999';

    vi.doMock('react-native', () => ({ Platform: { OS: 'ios' } }));
    vi.doMock('expo-constants', () => ({
      default: { expoConfig: {} },
    }));

    const { WS_URL } = await import('./wsConfig');
    expect(WS_URL).not.toContain('9999');
    expect(WS_URL).not.toMatch(/:8080:8080/);
  });

  test('correctly strips port when hostUri contains an unusual port number', async () => {
    vi.doMock('react-native', () => ({ Platform: { OS: 'ios' } }));
    vi.doMock('expo-constants', () => ({
      default: { expoConfig: { hostUri: '10.0.0.42:19000' } },
    }));

    const { WS_URL } = await import('./wsConfig');
    expect(WS_URL).toBe('ws://10.0.0.42:8080');
    expect(WS_URL).not.toContain('19000');
  });
});
