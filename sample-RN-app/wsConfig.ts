import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Strip any scheme (ws:// / wss://) and embedded port from a raw host string.
 * Prevents malformed WS_URL when the env var is set with extra context
 * (e.g. 'ws://192.168.1.1' or '192.168.1.1:9999').
 */
const sanitizeHost = (raw: string): string =>
  raw.replace(/^wss?:\/\//, '').split(':')[0];

/**
 * Resolve the WebSocket server host for the current environment.
 *
 * Priority order:
 *  1. EXPO_PUBLIC_WS_HOST env var   — set in .env.local to override for your machine
 *  2. Expo's hostUri                — available in Expo Go / dev client; gives the LAN IP
 *  3. Android emulator default      — 10.0.2.2 routes to the host machine's localhost
 *  4. 'localhost'                   — fallback for iOS simulator
 */
const envHost = process.env.EXPO_PUBLIC_WS_HOST
  ? sanitizeHost(process.env.EXPO_PUBLIC_WS_HOST)
  : null;

const host: string =
  envHost ||
  Constants.expoConfig?.hostUri?.split(':')[0] ||
  (Platform.OS === 'android' ? '10.0.2.2' : 'localhost');

export const WS_URL = `ws://${host}:8080`;
