import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Resolve the WebSocket server host for the current environment.
 *
 * Priority order:
 *  1. EXPO_PUBLIC_WS_HOST env var   — set in .env.local to override for your machine
 *  2. Expo's hostUri                — available in Expo Go / dev client; gives the LAN IP
 *  3. Android emulator default      — 10.0.2.2 routes to the host machine's localhost
 *  4. 'localhost'                   — fallback for iOS simulator
 */
const host: string =
  process.env.EXPO_PUBLIC_WS_HOST ||
  Constants.expoConfig?.hostUri?.split(':')[0] ||
  (Platform.OS === 'android' ? '10.0.2.2' : 'localhost');

export const WS_URL = `ws://${host}:8080`;
