// transport/socket.ts
import { createListenerMiddleware } from '@reduxjs/toolkit';
import { addSnapshot } from '../slices/snapshotSlice';
import { wsConnect, wsDisconnect, wsSend } from './wsActions';

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
