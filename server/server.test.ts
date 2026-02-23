/**
 * server.test.ts
 *
 * Tests for the WebSocket server's broadcast routing logic and end-to-end
 * connection behavior. Structured in two layers:
 *
 *   UNIT TESTS        — broadcast() in isolation using mock ws client objects
 *   INTEGRATION TESTS — real ws server on port 8081 per test run
 *
 * Run: npx vitest run server/server.test.ts
 *
 * Prerequisites: `ws` and `@types/ws` must be installed as devDependencies.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import WebSocket, { WebSocketServer } from 'ws';
import { createRequire } from 'node:module';

// ── Import from the CommonJS server module ──────────────────────────────────
// server.js uses CommonJS exports; createRequire gives us clean interop
// without converting the server to ESM.
const _require = createRequire(import.meta.url);

type BroadcastFn = (
  wss: { clients: Set<{ readyState: number; send: (data: string) => void }> },
  senderWs: { readyState?: number; send: (data: string) => void },
  parsed: unknown
) => void;

const { broadcast, createServer } = _require('./server') as {
  broadcast: BroadcastFn;
  createServer: (port?: number, host?: string) => WebSocketServer;
};

// ══════════════════════════════════════════════════════════════════════════════
// UNIT TESTS
// broadcast() tested in isolation with mock ws client objects.
// No real server or network involved — fast, deterministic, zero flakiness.
// ══════════════════════════════════════════════════════════════════════════════

type MockClient = { readyState: number; send: ReturnType<typeof vi.fn> };

/** Factory for a mock ws client with a spy on send(). */
const makeMock = (readyState = WebSocket.OPEN): MockClient => ({
  readyState,
  send: vi.fn(),
});

describe('broadcast (unit)', () => {
  it('sends to all OPEN clients except the sender in multi-client mode', () => {
    const sender  = makeMock();
    const clientA = makeMock();
    const clientB = makeMock();
    const wss = { clients: new Set([sender, clientA, clientB]) };

    broadcast(wss, sender, { channel: 'snapshot', type: 'add', payload: {} });

    expect(sender.send).not.toHaveBeenCalled();
    expect(clientA.send).toHaveBeenCalledOnce();
    expect(clientB.send).toHaveBeenCalledOnce();
  });

  it('skips clients whose readyState is not OPEN', () => {
    const sender           = makeMock();
    const closedClient     = makeMock(WebSocket.CLOSED);
    const connectingClient = makeMock(WebSocket.CONNECTING);
    const openClient       = makeMock(WebSocket.OPEN);
    const wss = { clients: new Set([sender, closedClient, connectingClient, openClient]) };

    broadcast(wss, sender, { type: 'test' });

    expect(closedClient.send).not.toHaveBeenCalled();
    expect(connectingClient.send).not.toHaveBeenCalled();
    expect(openClient.send).toHaveBeenCalledOnce();
  });

  it('echoes back to the sender when only one client is connected (debug mode)', () => {
    const sender = makeMock();
    const wss    = { clients: new Set([sender]) };
    const msg    = { channel: 'snapshot', type: 'add', payload: { id: 'solo-1' } };

    broadcast(wss, sender, msg);

    expect(sender.send).toHaveBeenCalledWith(JSON.stringify(msg));
  });

  it('serializes the parsed object back to JSON before sending', () => {
    const sender   = makeMock();
    const receiver = makeMock();
    const wss      = { clients: new Set([sender, receiver]) };
    const msg      = { channel: 'metrics', type: 'commit', payload: { durationMs: 42 } };

    broadcast(wss, sender, msg);

    expect(receiver.send).toHaveBeenCalledWith(JSON.stringify(msg));
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// INTEGRATION TESTS
// Real ws server on port 8081. Each test uses actual network I/O to verify
// end-to-end behavior that unit tests cannot cover: connection lifecycle,
// JSON parsing, TCP close handling.
// ══════════════════════════════════════════════════════════════════════════════

const TEST_PORT = 8081;
const WS_URL    = `ws://localhost:${TEST_PORT}`;

/** Opens a real WebSocket connection and resolves once the handshake completes. */
function connectClient(): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL);
    ws.once('open',  () => resolve(ws));
    ws.once('error', reject);
  });
}

/** Resolves with the raw string payload of the next message received on `ws`. */
function nextMessage(ws: WebSocket): Promise<string> {
  return new Promise((resolve) =>
    ws.once('message', (data) => resolve(String(data)))
  );
}

/** Closes a client and resolves once the TCP close handshake completes. */
function closeClient(ws: WebSocket): Promise<void> {
  return new Promise((resolve) => {
    if (ws.readyState === WebSocket.CLOSED) return resolve();
    ws.once('close', resolve);
    ws.close();
  });
}

describe('server (integration)', () => {
  let server: WebSocketServer;
  const openClients: WebSocket[] = [];

  beforeEach(async () => {
    server = createServer(TEST_PORT);
    // Wait for the OS to bind the port before clients try to connect.
    if (!server.listening) {
      await new Promise<void>((resolve) => server.once('listening', resolve));
    }
  });

  afterEach(async () => {
    // Close every client first so server.close() callback fires promptly.
    await Promise.all(openClients.map(closeClient));
    openClients.length = 0;
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('accepts a client connection', async () => {
    const ws = await connectClient();
    openClients.push(ws);

    expect(ws.readyState).toBe(WebSocket.OPEN);
  });

  it('forwards a message from client A to client B', async () => {
    const [clientA, clientB] = await Promise.all([connectClient(), connectClient()]);
    openClients.push(clientA, clientB);

    const received = nextMessage(clientB);
    const msg = { channel: 'snapshot', type: 'add', payload: { id: 'test-1' } };
    clientA.send(JSON.stringify(msg));

    expect(JSON.parse(await received)).toEqual(msg);
  });

  it('does not echo the message back to the sender in multi-client mode', async () => {
    const [clientA, clientB] = await Promise.all([connectClient(), connectClient()]);
    openClients.push(clientA, clientB);

    const senderReceived = vi.fn();
    clientA.on('message', senderReceived);

    // Await clientB confirming receipt — broadcast is complete at this point.
    const clientBReceived = nextMessage(clientB);
    clientA.send(JSON.stringify({ channel: 'metrics', type: 'commit', payload: {} }));
    await clientBReceived;

    // Server never called send() on clientA's socket, so no message can arrive.
    expect(senderReceived).not.toHaveBeenCalled();
  });

  it('responds to a ping with a pong on the control channel', async () => {
    const client = await connectClient();
    openClients.push(client);

    const reply = nextMessage(client);
    client.send(JSON.stringify({ channel: 'control', type: 'ping' }));

    expect(JSON.parse(await reply)).toEqual({ channel: 'control', type: 'pong' });
  });

  it('returns a control/error envelope for malformed JSON without crashing', async () => {
    const client = await connectClient();
    openClients.push(client);

    const reply = nextMessage(client);
    client.send('not valid json {{{{');

    expect(JSON.parse(await reply)).toMatchObject({
      channel: 'control',
      type:    'error',
      payload: {
        message: 'Failed to parse JSON',
        raw:     'not valid json {{{{',
      },
    });
  });

  it('continues serving remaining clients after a disconnect', async () => {
    const [clientA, clientB] = await Promise.all([connectClient(), connectClient()]);
    openClients.push(clientA, clientB);

    // Disconnect clientA and wait for the server to process the TCP close.
    await closeClient(clientA);
    openClients.splice(openClients.indexOf(clientA), 1);

    // Server is still alive — a new client can connect and receive broadcasts.
    const clientC = await connectClient();
    openClients.push(clientC);

    const received = nextMessage(clientC);
    clientB.send(JSON.stringify({ channel: 'snapshot', type: 'add', payload: {} }));

    expect(JSON.parse(await received)).toMatchObject({ channel: 'snapshot' });
  });

  it('echoes a message back to the sole connected client (single-client debug mode)', async () => {
    const client = await connectClient();
    openClients.push(client);

    const reply = nextMessage(client);
    const msg   = { channel: 'metrics', type: 'lag', payload: { lagMs: 17 } };
    client.send(JSON.stringify(msg));

    expect(JSON.parse(await reply)).toEqual(msg);
  });
});
