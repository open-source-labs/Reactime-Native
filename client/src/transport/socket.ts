import { createListenerMiddleware } from '@reduxjs/toolkit';
import { addSnapshot, snapshotSlice } from '../slices/snapshotSlice';
import { wsConnect, wsDisconnect, wsSend } from '../store/store';

const parseData = async (d: any) => {
  if (typeof d === 'string') return JSON.parse(d);
  if (d instanceof Blob) return JSON.parse(await d.text());
  if (d instanceof ArrayBuffer) return JSON.parse(new TextDecoder().decode(d));
  throw new Error('Unknown WS message type');
};

export const wsListener = createListenerMiddleware();

let socket: WebSocket | null = null;

// Open socket on ws/connect
wsListener.startListening({
  actionCreator: wsConnect,
  effect: async (action, api) => {
    // if already open, do nothing
    if (socket && socket.readyState === WebSocket.OPEN) return;

    socket = new WebSocket(action.payload as string);

    const onMessage = async (e: MessageEvent) => {
      try {
        api.dispatch(addSnapshot(await parseData(e.data)));
      } catch (err) {
        console.error('WS parse error:', err);
      }
    };
    socket.addEventListener('message', onMessage);

    // ChatGPT suggestion: Cleanup when this listener is cancelled (e.g., store teardown) or on ws/disconnect
    const abortHandler = () => {
      socket?.close();
      socket = null;
    };
    api.signal.addEventListener('abort', abortHandler);
  },
});

// Send data with ws/send
wsListener.startListening({
  actionCreator: wsSend,
  effect: async (action) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(action.payload));
    }
  },
});
