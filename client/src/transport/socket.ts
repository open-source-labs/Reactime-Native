// client/src/transport/socket.ts
import { createAction, createListenerMiddleware } from '@reduxjs/toolkit';
import { addSnapshot, jumpToSnapshot } from '../slices/snapshotSlice';
import { pushCommitMetric, pushLagMetric, pushFirstRenderMetric } from '../slices/metricSlice';

//  WS command actions (UI or app code can dispatch these)
export const wsConnect    = createAction<string | undefined>('ws/connect');     // optional URL
export const wsDisconnect = createAction('ws/disconnect'); // no payload
export const wsSend       = createAction<unknown>('ws/send'); // payload is message object to send

// Incoming WS message envelope schema (from RN agent)
type SnapshotAdd = { channel: 'snapshot'; type: 'add'; payload: unknown }; // type payload more strictly?
type SnapshotJump = { channel: 'snapshot'; type: 'jumpTo'; payload: { index: number } }; // jump to snapshot at index

type CommitMetricMsg = { // shape of commit metric message from RN agent
  channel: 'metrics'; // channel name
  type: 'commit'; // message type
  payload: { ts: number; durationMs: number; fibersUpdated?: number; appId?: string }; // message payload
};

type LagMetricMsg = {
  channel: 'metrics';
  type: 'lag';
  payload: { ts: number; lagMs: number; appId?: string };
};

// first screen render (RN agent will send this once)
type FirstRenderMetricMsg = { 
  channel: 'metrics';
  type: 'firstRender';
  payload: { ts: number; firstRenderMs: number; appId?: string };
};

type ControlMsg = // control channel for pings, errors, etc.
  | { channel: 'control'; type: 'ping' } // optional health ping from RN agent
  | { channel: 'control'; type: 'pong' } // optional pong response
  | { channel: 'control'; type: 'error'; payload?: unknown }; // error message (payload may be anything)

type Envelope = // union of all message types
  | SnapshotAdd
  | SnapshotJump
  | CommitMetricMsg
  | LagMetricMsg
  | FirstRenderMetricMsg
  | ControlMsg;


const parseData = async (d: unknown) => { // parse incoming WS data (string, Blob, ArrayBuffer) to JSON
  if (typeof d === 'string') return JSON.parse(d); // most common case
  if (d instanceof Blob) return JSON.parse(await d.text()); // unlikely with React Native, but just in case
  if (d instanceof ArrayBuffer) return JSON.parse(new TextDecoder().decode(d)); // also unlikely
  throw new Error('Unknown WS data type'); // shouldn't happen
};

const defaultWsUrl = () => { // default WS URL based on current location
  const proto = location.protocol === 'https:' ? 'wss' : 'ws'; // secure if page is secure
  return `${proto}://${location.hostname}:8080`; // default port 8080
};

export const wsListener = createListenerMiddleware(); // create the listener middleware instance

let socket: WebSocket | null = null; // track current socket instance
let closedByUser = false; // track if close was user-initiated (vs. unexpected) 


wsListener.startListening({ // CONNECT
  actionCreator: wsConnect, // when this action is dispatched, run the effect
  effect: async (action, api) => { // effect is async to allow waiting for socket close
    const url = action.payload || defaultWsUrl(); //

    // Avoid duplicates (StrictMode double-invoke, remounts, etc.)
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
      console.log('[ws] already connecting/open');
      return;
    }

    closedByUser = false;
    console.log('[ws] connecting to', url);
    socket = new WebSocket(url);

    socket.onopen = () => {
      console.log('[ws] OPEN', url);
      // optional health ping
      socket?.send(JSON.stringify({ channel: 'control', type: 'ping' }));
      if (closedByUser) socket?.close(); // if a disconnect was requested during CONNECTING
    };

    socket.onerror = (e) => console.log('[ws] ERROR', e); // close event will follow

    // Handle incoming messages
    // Note: messages may arrive before onopen completes, so this must be set before that
    const onMessage = async (e: MessageEvent) => { 
        console.log( 'e data:', e.data, e);
      try {
        const msg = (await parseData(e.data)) as Envelope;
        
        // Route by channel/type
        switch (msg.channel) {
          case 'snapshot': {
            if (msg.type === 'add') api.dispatch(addSnapshot(msg.payload));
            if (msg.type === 'jumpTo') api.dispatch(jumpToSnapshot(msg.payload.index));
            break;
          }
          case 'metrics': {
            if (msg.type === 'commit') api.dispatch(pushCommitMetric(msg.payload));
            if (msg.type === 'lag') api.dispatch(pushLagMetric(msg.payload));
            if (msg.type === 'firstRender') api.dispatch(pushFirstRenderMetric(msg.payload));
            break;
          }
          case 'control': {
            if (msg.type === 'pong') console.log('[ws] pong');
            if (msg.type === 'error') console.warn('[ws] remote error:', (msg.payload)); // (msg as any).payload caused TS error 
            break;
          }
        }
      } catch (err) {
        console.error('[ws] parse error:', err);
      }
    };

    socket.addEventListener('message', onMessage);

    // Wait until socket closes OR this listener is aborted
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
          // if CONNECTING, onopen will close immediately
        },
        { once: true }
      );
    });
  },
});

// DISCONNECT
wsListener.startListening({
  actionCreator: wsDisconnect,
  effect: () => { // no need for async here because not waiting for close to complete
    if (!socket) return; // 
    closedByUser = true; 
    console.log('[ws] manual DISCONNECT (state:', socket.readyState, ')');
    if (socket.readyState === WebSocket.OPEN) socket.close();
  },
});

// SEND
wsListener.startListening({
  actionCreator: wsSend,
  effect: (action) => { 
    if (socket?.readyState === WebSocket.OPEN) { // only send if open
      socket.send(JSON.stringify(action.payload));
    } else {
      console.log('[ws] SEND skipped (not open)');
    }
  },
});