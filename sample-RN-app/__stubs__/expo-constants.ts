/**
 * Minimal expo-constants stub for Vitest.
 * Vite resolves 'expo-constants' here (via resolve.alias) so Rollup never
 * tries to parse the real expo-constants package.
 * vi.doMock('expo-constants', factory) in individual test files overrides
 * this at test runtime.
 */
const Constants = {
  expoConfig: null as null | { hostUri?: string },
};
export default Constants;
