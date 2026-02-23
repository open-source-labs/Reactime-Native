/**
 * websocket.integration.test.ts
 *
 * Integration test validating the three-layer architecture end-to-end:
 *
 *   Layer 1 — wsConfig:   resolves WS_URL from EXPO_PUBLIC_WS_HOST env var
 *   Layer 2 — WebSocket:  RN client sends snapshot → ws server → browser client receives
 *   Layer 3 — Redux:      received message is dispatched to snapshotSlice → store updated
 *
 * What each layer proves:
 *   - wsConfig correctly sanitizes and formats the URL from env input
 *   - The native WebSocket transport delivers messages reliably across real sockets
 *   - addSnapshot correctly appends to the Redux store and notifies subscribers
 *
 * Full round-trip path under test:
 *   EXPO_PUBLIC_WS_HOST → wsConfig.WS_URL
 *     → rnClient.send(JSON.stringify(snapshot))
 *     → test ws server receives + broadcasts
 *     → browserClient receives raw message
 *     → dispatch(addSnapshot(JSON.parse(raw)))
 *     → store.getState().snapshot.snapshots contains the snapshot
 *     → subscribed listener fires (equivalent to useSelector re-render)
 *
 * Setup required (add to sample-RN-app/package.json devDependencies):
 *   "vitest": "^3.x"
 *   "@reduxjs/toolkit": "^2.x"
 *   "@types/ws": "^8.x"
 * And create sample-RN-app/vitest.config.ts with { test: { environment: 'node' } }.
 *
 * The `ws` package is already a runtime dependency.
 */

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { WebSocket as WsClient, WebSocketServer } from 'ws';
import type { WebSocket as WsSocket } from 'ws';

// Redux — add @reduxjs/toolkit to devDependencies in sample-RN-app/package.json
import { configureStore, createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

// ── Inline snapshotSlice (mirrors client/src/slices/snapshotSlice.ts) ────────
// Inlined here to keep this test self-contained; no cross-package import needed.
interface SnapshotState {
  snapshots: unknown[];
  currentIndex: number;
}

const snapshotSlice = createSlice({
  name: 'snapshot',
  initialState: { snapshots: [], currentIndex: 0 } as SnapshotState,
  reducers: {
    addSnapshot(state, action: PayloadAction<unknown>) {
      state.snapshots.push(action.payload);
      state.currentIndex = state.snapshots.length - 1;
    },
  },
});

const { addSnapshot } = snapshotSlice.actions;

const makeStore = () =>
  configureStore({ reducer: { snapshot: snapshotSlice.reducer } });

type AppStore = ReturnType<typeof makeStore>;

// ── Test server ───────────────────────────────────────────────────────────────
const TEST_PORT = 8081;
let wss: WebSocketServer;
const serverMessages: string[] = [];

beforeAll(() => {
  return new Promise<void>((resolve) => {
    wss = new WebSocketServer({ port: TEST_PORT, host: '127.0.0.1' }, resolve);

    wss.on('connection', (ws: WsSocket) => {
      ws.on('message', (data: Buffer | string) => {
        const msg = typeof data === 'string' ? data : data.toString();
        serverMessages.push(msg);

        // Mirrors server/server.js broadcast: echo to self when alone, else forward to others.
        if (wss.clients.size === 1) {
          ws.send(msg);
        } else {
          for (const client of wss.clients) {
            if (client !== ws && client.readyState === WsClient.OPEN) {
              client.send(msg);
            }
          }
        }
      });
    });
  });
});

afterAll(() => {
  return new Promise<void>((resolve) => wss.close(() => resolve()));
});

beforeEach(() => {
  serverMessages.length = 0;
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function connectClient(url: string): Promise<WsSocket> {
  return new Promise((resolve, reject) => {
    const client = new WsClient(url);
    client.once('open', () => resolve(client));
    client.once('error', reject);
  });
}

function nextMessage(client: WsSocket): Promise<string> {
  return new Promise((resolve) => {
    client.once('message', (data: Buffer | string) =>
      resolve(typeof data === 'string' ? data : data.toString())
    );
  });
}

function closeClient(client: WsSocket): Promise<void> {
  return new Promise((resolve) => {
    client.once('close', resolve);
    client.close();
  });
}

// ════════════════════════════════════════════════════════════════════════════
// INTEGRATION TESTS
// ════════════════════════════════════════════════════════════════════════════

describe('WebSocket integration — three-layer flow', () => {
  const WS_URL = `ws://127.0.0.1:${TEST_PORT}`;

  // Layer 1 ───────────────────────────────────────────────────────────────────
  describe('Layer 1 — wsConfig URL resolution', () => {
    it('resolves WS_URL to ws://127.0.0.1:8080 when EXPO_PUBLIC_WS_HOST is set', async () => {
      vi.resetModules();
      process.env.EXPO_PUBLIC_WS_HOST = '127.0.0.1';

      vi.doMock('react-native', () => ({ Platform: { OS: 'ios' } }));
      vi.doMock('expo-constants', () => ({ default: { expoConfig: {} } }));

      const { WS_URL: resolved } = await import('./wsConfig');
      expect(resolved).toBe('ws://127.0.0.1:8080');

      delete process.env.EXPO_PUBLIC_WS_HOST;
      vi.resetModules();
    });

    it('strips ws:// prefix from EXPO_PUBLIC_WS_HOST before building URL', async () => {
      vi.resetModules();
      process.env.EXPO_PUBLIC_WS_HOST = 'ws://192.168.1.100';

      vi.doMock('react-native', () => ({ Platform: { OS: 'ios' } }));
      vi.doMock('expo-constants', () => ({ default: { expoConfig: {} } }));

      const { WS_URL: resolved } = await import('./wsConfig');
      expect(resolved).not.toContain('ws://ws://');
      expect(resolved).toMatch(/^ws:\/\/192\.168\.1\.100:8080$/);

      delete process.env.EXPO_PUBLIC_WS_HOST;
      vi.resetModules();
    });
  });

  // Layer 2 ───────────────────────────────────────────────────────────────────
  describe('Layer 2 — WebSocket transport', () => {
    it('an RN client connects to the test server successfully', async () => {
      const client = await connectClient(WS_URL);
      expect(client.readyState).toBe(WsClient.OPEN);
      await closeClient(client);
    });

    it('a message sent by the RN client arrives at the server', async () => {
      const client = await connectClient(WS_URL);

      const payload = JSON.stringify({
        count: 1,
        letter: 'b',
        timestamp: new Date().toISOString(),
      });
      client.send(payload);

      // Allow the message to propagate through the event loop
      await new Promise((r) => setTimeout(r, 50));

      expect(serverMessages).toHaveLength(1);
      expect(JSON.parse(serverMessages[0])).toMatchObject({ count: 1, letter: 'b' });

      await closeClient(client);
    });

    it('server forwards the RN message to the browser client (two-client broadcast)', async () => {
      const [rnClient, browserClient] = await Promise.all([
        connectClient(WS_URL),
        connectClient(WS_URL),
      ]);

      const receivePromise = nextMessage(browserClient);

      rnClient.send(
        JSON.stringify({ count: 2, letter: 'c', timestamp: new Date().toISOString() })
      );

      const received = await receivePromise;
      expect(JSON.parse(received)).toMatchObject({ count: 2, letter: 'c' });

      await Promise.all([closeClient(rnClient), closeClient(browserClient)]);
    });

    it('sender does NOT receive its own message in multi-client mode', async () => {
      const [rnClient, browserClient] = await Promise.all([
        connectClient(WS_URL),
        connectClient(WS_URL),
      ]);

      let senderReceived = false;
      rnClient.once('message', () => { senderReceived = true; });

      const browserReceive = nextMessage(browserClient);
      rnClient.send(JSON.stringify({ count: 3, letter: 'd' }));

      await browserReceive; // wait until browser side gets it

      // Give the RN client a tick to (incorrectly) fire
      await new Promise((r) => setTimeout(r, 30));
      expect(senderReceived).toBe(false);

      await Promise.all([closeClient(rnClient), closeClient(browserClient)]);
    });
  });

  // Layer 3 ───────────────────────────────────────────────────────────────────
  describe('Layer 3 — Redux store (snapshotSlice)', () => {
    it('dispatching addSnapshot updates the Redux store', () => {
      const store: AppStore = makeStore();

      store.dispatch(addSnapshot({ count: 5, letter: 'f', timestamp: 'ts1' }));

      const { snapshots, currentIndex } = store.getState().snapshot;
      expect(snapshots).toHaveLength(1);
      expect(snapshots[0]).toMatchObject({ count: 5, letter: 'f' });
      expect(currentIndex).toBe(0);
    });

    it('currentIndex advances with each dispatched snapshot', () => {
      const store: AppStore = makeStore();

      store.dispatch(addSnapshot({ count: 1, letter: 'a' }));
      store.dispatch(addSnapshot({ count: 2, letter: 'b' }));
      store.dispatch(addSnapshot({ count: 3, letter: 'c' }));

      const { snapshots, currentIndex } = store.getState().snapshot;
      expect(snapshots).toHaveLength(3);
      expect(currentIndex).toBe(2);
    });

    it('a subscribed listener fires on each addSnapshot dispatch (equivalent to useSelector re-render)', () => {
      const store: AppStore = makeStore();
      const received: unknown[] = [];

      const unsubscribe = store.subscribe(() => {
        const { snapshots } = store.getState().snapshot;
        received.push(snapshots[snapshots.length - 1]);
      });

      store.dispatch(addSnapshot({ count: 4, letter: 'e', timestamp: 'ts-a' }));
      store.dispatch(addSnapshot({ count: 5, letter: 'f', timestamp: 'ts-b' }));

      expect(received).toHaveLength(2);
      expect(received[0]).toMatchObject({ count: 4, letter: 'e' });
      expect(received[1]).toMatchObject({ count: 5, letter: 'f' });

      unsubscribe();
    });
  });

  // Full round trip ────────────────────────────────────────────────────────────
  describe('Full round trip — RN send → server broadcast → Redux updated', () => {
    it('snapshot travels from RN client through server to Redux store', async () => {
      const store: AppStore = makeStore();

      const [rnClient, browserClient] = await Promise.all([
        connectClient(WS_URL),
        connectClient(WS_URL),
      ]);

      const receivePromise = nextMessage(browserClient);

      const outgoing = { count: 10, letter: 'z', timestamp: new Date().toISOString() };
      rnClient.send(JSON.stringify(outgoing));

      const raw = await receivePromise;
      const parsed = JSON.parse(raw);
      store.dispatch(addSnapshot(parsed));

      const { snapshots } = store.getState().snapshot;
      expect(snapshots).toHaveLength(1);
      expect(snapshots[0]).toMatchObject({ count: 10, letter: 'z' });

      await Promise.all([closeClient(rnClient), closeClient(browserClient)]);
    });

    it('multiple sequential snapshots accumulate in store order', async () => {
      const store: AppStore = makeStore();

      const [rnClient, browserClient] = await Promise.all([
        connectClient(WS_URL),
        connectClient(WS_URL),
      ]);

      const snapshots = [
        { count: 0, letter: 'a' },
        { count: 1, letter: 'b' },
        { count: 2, letter: 'c' },
      ];

      for (const snap of snapshots) {
        const receivePromise = nextMessage(browserClient);
        rnClient.send(JSON.stringify({ ...snap, timestamp: new Date().toISOString() }));
        const raw = await receivePromise;
        store.dispatch(addSnapshot(JSON.parse(raw)));
      }

      const { snapshots: stored, currentIndex } = store.getState().snapshot;
      expect(stored).toHaveLength(3);
      expect(stored[0]).toMatchObject({ count: 0, letter: 'a' });
      expect(stored[2]).toMatchObject({ count: 2, letter: 'c' });
      expect(currentIndex).toBe(2);

      await Promise.all([closeClient(rnClient), closeClient(browserClient)]);
    });
  });
});
