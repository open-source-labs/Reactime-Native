// client/src/transport/socket.ts
import { createAction, createListenerMiddleware } from '@reduxjs/toolkit';
import { addSnapshot, jumpToSnapshot } from '../slices/snapshotSlice';
import { pushCommitMetric, pushLagMetric, pushFirstRenderMetric } from '../slices/metricSlice';

// WS command actions (UI or app code can dispatch these)
export const wsConnect    = createAction<string | undefined>('ws/connect');
export const wsDisconnect = createAction('ws/disconnect');
export const wsSend       = createAction<unknown>('ws/send');

// Incoming WS message envelope schema (from RN agent)
type SnapshotAdd  = { channel: 'snapshot'; type: 'add';    payload: unknown };
type SnapshotJump = { channel: 'snapshot'; type: 'jumpTo'; payload: { index: number } };

type CommitMetricMsg = {
  channel: 'metrics';
  type: 'commit';
  payload: { ts: number; durationMs: number; fibersUpdated?: number; appId?: string };
};

type LagMetricMsg = {
  channel: 'metrics';
  type: 'lag';
  payload: { ts: number; lagMs: number; appId?: string };
};

type FirstRenderMetricMsg = {
  channel: 'metrics';
  type: 'firstRender';
  payload: { ts: number; firstRenderMs: number; appId?: string };
};

type ControlMsg =
  | { channel: 'control'; type: 'ping' }
  | { channel: 'control'; type: 'pong' }
  | { channel: 'control'; type: 'error'; payload?: unknown };

type Envelope =
  | SnapshotAdd
  | SnapshotJump
  | CommitMetricMsg
  | LagMetricMsg
  | FirstRenderMetricMsg
  | ControlMsg;

const parseData = async (d: unknown) => {
  if (typeof d === 'string') return JSON.parse(d);
  if (d instanceof Blob) return JSON.parse(await d.text());
  if (d instanceof ArrayBuffer) return JSON.parse(new TextDecoder().decode(d));
  throw new Error('Unknown WS data type');
};

const defaultWsUrl = () => {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  return `${proto}://${location.hostname}:8080`;
};

export const wsListener = createListenerMiddleware();

let socket: WebSocket | null = null;
let closedByUser = false;

// CONNECT
wsListener.startListening({
  actionCreator: wsConnect,
  effect: async (action, api) => {
    const url = action.payload || defaultWsUrl();

    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
      console.log('[ws] already connecting/open');
      return;
    }

    closedByUser = false;
    console.log('[ws] connecting to', url);
    socket = new WebSocket(url);

    socket.onopen = () => {
      console.log('[ws] OPEN', url);
      socket?.send(JSON.stringify({ channel: 'control', type: 'ping' }));
      if (closedByUser) socket?.close();
    };

    socket.onerror = (e) => console.log('[ws] ERROR', e);

    const onMessage = async (e: MessageEvent) => {
      console.log('e data:', e.data, e);
      try {
        const msg = (await parseData(e.data)) as Envelope;

        switch (msg.channel) {
          case 'snapshot': {
            if (msg.type === 'add')    api.dispatch(addSnapshot(msg.payload));
            if (msg.type === 'jumpTo') api.dispatch(jumpToSnapshot(msg.payload.index));
            break;
          }
          case 'metrics': {
            if (msg.type === 'commit')      api.dispatch(pushCommitMetric(msg.payload));
            if (msg.type === 'lag')         api.dispatch(pushLagMetric(msg.payload));
            if (msg.type === 'firstRender') api.dispatch(pushFirstRenderMetric(msg.payload));
            break;
          }
          case 'control': {
            if (msg.type === 'pong')  console.log('[ws] pong');
            if (msg.type === 'error') console.warn('[ws] remote error:', msg.payload);
            break;
          }
        }
      } catch (err) {
        console.error('[ws] parse error:', err);
      }
    };

    socket.addEventListener('message', onMessage);

    await new Promise<void>((resolve) => {
      const onClose = (e: CloseEvent) => {
        console.log('[ws] CLOSE', e.code, e.reason || '', closedByUser ? '(by user)' : '(unexpected)');
        socket?.removeEventListener('message', onMessage);
        socket = null;
        resolve();
      };
      socket!.addEventListener('close', onClose);

      api.signal.addEventListener(
        'abort',
        () => {
          closedByUser = true;
          if (socket?.readyState === WebSocket.OPEN) socket.close();
        },
        { once: true }
      );
    });
  },
});

// DISCONNECT
wsListener.startListening({
  actionCreator: wsDisconnect,
  effect: () => {
    if (!socket) return;
    closedByUser = true;
    console.log('[ws] manual DISCONNECT (state:', socket.readyState, ')');
    if (socket.readyState === WebSocket.OPEN) socket.close();
  },
});

// SEND
wsListener.startListening({
  actionCreator: wsSend,
  effect: (action) => {
    console.log('🚀 Attempting to send:', action.payload);
    console.log('📡 Socket state:', {
      socketExists: !!socket,
      readyState: socket?.readyState,
      readyStateText: socket?.readyState === 0 ? 'CONNECTING' :
                      socket?.readyState === 1 ? 'OPEN' :
                      socket?.readyState === 2 ? 'CLOSING' :
                      socket?.readyState === 3 ? 'CLOSED' : 'UNKNOWN'
    });

    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(action.payload));
      console.log('✅ Message sent successfully');
    } else {
      console.log('[ws] SEND skipped (not open), readyState:', socket?.readyState);
    }
  },
});
