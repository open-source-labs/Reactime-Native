import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      // Point react-native and expo-constants to minimal stubs so Vite/Rollup
      // never tries to parse the real packages (which contain Flow syntax).
      // vi.mock / vi.doMock in test files still overrides these at test runtime.
      'react-native': path.resolve(__dirname, '__stubs__/react-native.ts'),
      'expo-constants': path.resolve(__dirname, '__stubs__/expo-constants.ts'),
    },
  },
  test: {
    // environmentMatchGlobs was removed in Vitest v4. Use projects instead.
    projects: [
      {
        // extends: true inherits root resolve.alias so stubs apply here too.
        extends: true,
        test: {
          name: 'unit',
          include: ['**/*.unit.test.tsx'],
          environment: 'jsdom',
        },
      },
      {
        extends: true,
        test: {
          name: 'node',
          include: ['**/*.test.ts', '**/*.integration.test.ts'],
          environment: 'node',
        },
      },
    ],
  },
});
