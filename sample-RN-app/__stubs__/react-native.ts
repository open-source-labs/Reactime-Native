/**
 * Minimal react-native stub for Vitest.
 * Vite resolves 'react-native' here (via resolve.alias) so Rollup never
 * tries to parse the real react-native/index.js which contains Flow syntax.
 * vi.mock / vi.doMock in individual test files overrides this at test runtime.
 */
export const Platform = { OS: 'ios' as string };
export const View = () => null;
export const Text = () => null;
export const Pressable = () => null;
export const Button = () => null;
export const StyleSheet = { create: <T extends object>(s: T): T => s };
