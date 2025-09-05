//  only import *type* to satisfy tsconfig's `verbatimModuleSyntax`
import type { AppDispatch } from '../store/store';

// import just actions WebSocket messages will map to and hence need to dispatch
import { addSnapshot, jumpToSnapshot } from '../slices/snapshotSlice';
import { pushCommitMetric, pushLagMetric } from '../slices/metricSlice';

// typed wrapper for every anticipated WS message
type Envelope =
  | { channel: 'snapshot'; type: 'add';    payload: unknown }
  | { channel: 'snapshot'; type: 'jumpTo'; payload: { index: number } }
  | { channel: 'metrics';  type: 'commit'; payload: { ts: number; durationMs: number; fibersUpdated?: number } }
  | { channel: 'metrics';  type: 'lag';    payload: { ts: number; lagMs: number } }
  | { channel: 'control';  type: 'ping' | 'pong' | 'error'; payload?: unknown };

// initSocket creates and configures ws connection to given URL (or default)
// and sets up event handlers to dispatch Redux actions based on incoming messages.
const { pushCommit, pushLag } = { pushCommit: pushCommitMetric, pushLag: pushLagMetric }; //alias to match Envelope
export function initSocket(dispatch: AppDispatch, url = defaultWsUrl()) { 
  const ws = new WebSocket(url); // create ws connection

  // on open, send ping for diagnostics
  ws.addEventListener('open', () => {
    console.log('[WS] open', url);
    ws.send(JSON.stringify({ channel: 'control', type: 'ping' }));
  });

  // on message, parse JSON
  ws.addEventListener('message', (evt) => { 
    const text = typeof evt.data === 'string' ? evt.data : ''; // expect text messages only
    if (!text) { 
      console.warn('[WS] non-text message ignored:', evt.data);
      return;
    }
    let msg: Envelope | null = null; 
    try { 
      msg = JSON.parse(text) as Envelope; // // try to parse JSON into Envelope
    } catch {
      console.warn('[WS] non-JSON message ignored:', evt.data);
      return;
    }

    // route by channel/type to dispatch right Redux action
    switch (msg.channel) {
      case 'snapshot': { 
        if (msg.type === 'add') dispatch(addSnapshot(msg.payload));
        else if (msg.type === 'jumpTo') dispatch(jumpToSnapshot(msg.payload.index));
        break;
      }
      case 'metrics': {
        if (msg.type === 'commit') dispatch(pushCommit(msg.payload));
        else if (msg.type === 'lag') dispatch(pushLag(msg.payload));
        break;
      }
      case 'control': {
        if (msg.type === 'pong') console.log('[WS] pong');
        if (msg.type === 'error') console.warn('[WS] remote error:', msg.payload);
        break;
      }
      default: {
        // Exhaustiveness guard: if new union member added but forget to handle it, TS complains
        const _exhaustive: never = msg;
        return _exhaustive;
      }
    }
  });

  // close/error handlers for diagnostics (and future reconnection logic)
  ws.addEventListener('close', (evt) => {
    console.log('[WS] closed', evt.code, evt.reason);
  });

  ws.addEventListener('error', (err) => {
    console.error('[WS] error', err);
  });

  // return ws so callers can send messages or close it later
  return ws;
}

// build default URL based on current page (ws://… or wss://…)
function defaultWsUrl() {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  const host = location.hostname;
  const port = 8080;
  return `${proto}://${host}:${port}`;
}
// transport/socket.ts
import { createListenerMiddleware } from '@reduxjs/toolkit';
import { addSnapshot } from '../slices/snapshotSlice';
import { wsConnect, wsDisconnect, wsSend } from './wsActions';

// TODO: figure out why state sometimes persists on websockets disconnect/connect and sometimes doesn't

export const wsListener = createListenerMiddleware();

const parseData = async (d: unknown) => {
  if (typeof d === 'string') return JSON.parse(d);
  if (d instanceof Blob) return JSON.parse(await d.text());
  if (d instanceof ArrayBuffer) return JSON.parse(new TextDecoder().decode(d));
  throw new Error('Unknown WS data type');
};

let socket: WebSocket | null = null;
let closedByUser = false;

// OPEN on ws/connect
wsListener.startListening({
  actionCreator: wsConnect,
  effect: async (action, api) => {
    const url = action.payload;

    // prevent duplicate connects (StrictMode, remounts, etc.)
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
      console.log('[ws] already connecting/open');
      return;
    }

    closedByUser = false;
    console.log('[ws] connecting to', url);
    socket = new WebSocket(url);

    socket.onopen = () => {
      console.log('[ws] OPEN', url);
      if (closedByUser) {
        console.log('[ws] closing immediately after OPEN (disconnect requested during CONNECTING)');
        socket?.close();
      }
    };

    socket.onerror = (e) => console.log('[ws] ERROR', e);

    const onMessage = async (e: MessageEvent) => {
      try {
        const snap = await parseData(e.data);
        console.log('[ws] <-', snap);
        api.dispatch(addSnapshot(snap));
      } catch (err) {
        console.error('[ws] parse error:', err);
      }
    };
    socket.addEventListener('message', onMessage);

    // Wait until either the socket closes OR this listener is aborted
    await new Promise<void>((resolve) => {
      const onClose = (e: CloseEvent) => {
        console.log('[ws] CLOSE', e.code, e.reason || '', closedByUser ? '(by user)' : '(unexpected)');
        socket?.removeEventListener('message', onMessage);
        socket = null;
        resolve();
      };
      socket!.addEventListener('close', onClose);

      const onAbort = () => {
        closedByUser = true;
        // If still CONNECTING, let onopen close it; otherwise close now.
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.close();
        }
        // If CONNECTING, we’ll close in onopen; in both cases, resolve after close fires.
      };
      api.signal.addEventListener('abort', onAbort, { once: true });
    });
  },
});

// CLOSE on ws/disconnect
wsListener.startListening({
  actionCreator: wsDisconnect,
  effect: () => {
    if (!socket) return;
    closedByUser = true;
    console.log('[ws] manual DISCONNECT (state:', socket.readyState, ')');
    if (socket.readyState === WebSocket.OPEN) socket.close();
    // If CONNECTING, we let onopen immediately close it.
  },
});

// SEND
wsListener.startListening({
  actionCreator: wsSend,
  effect: async (action) => {
    if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(action.payload));
    else console.log('[ws] SEND skipped (not open)');
  },
});
