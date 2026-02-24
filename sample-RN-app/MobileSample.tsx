import React, { useEffect, useRef, useState } from 'react';
import { View, Button, Text, StyleSheet, Pressable } from 'react-native';
import { logFiber, traverse } from './useFiberTree';
import { WS_URL } from './wsConfig';

export default function App() {
  const [count, setCount] = useState(0);
  const [letter, setLetter] = useState('a');

  const ws = useRef<WebSocket | null>(null);

  /* open WebSocket once */
  useEffect(() => {
    const socket = new WebSocket(WS_URL);
    ws.current = socket;

    socket.onopen = () => {
      console.log('🔌 WS connected');
      socket.send(
        JSON.stringify({
          count: count,
          letter: letter,
          timestamp: new Date().toISOString(),
        })
      );
    };
    socket.onerror = (e) => {
      console.log('WS error', (e as any).message ?? e);
    };
    socket.onclose = () => console.log('WS closed');

    return () => socket.close();
  }, []);

  /* helper to broadcast the current state */
  const emit = (nextCount: number, nextLetter: string) => {
    const socket = ws.current;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          count: nextCount,
          letter: nextLetter,
          timestamp: new Date().toISOString(),
        })
      );
    }
  };

  const incCount = () =>
    setCount((e) => {
      const n = e + 1;
      emit(n, letter);
      return n;
    });

  const incLetter = () =>
    setLetter((e) => {
      const n = String.fromCharCode(((e.charCodeAt(0) - 97 + 1) % 26) + 97);
      emit(count, n);
      return n;
    });

  useEffect(() => {
    const hook = (globalThis as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (!hook) {
      console.log(' DevTools hook not found');
      return;
    }

    console.log('DevTools hook found!', Object.keys(hook));

    /* 1. Stream every commit through logFiber */
    hook.onCommitFiberRoot = (_id: any, root: any) => {
      logFiber(root.current);
    };

    /* 2. Walk existing trees once for an initial dump */
    const renderers = hook.renderers;
    if (!renderers || renderers.size === 0) {
      console.log(' No renderers found.');
      return;
    }

    for (const [rendererId, renderer] of renderers) {
      console.log(` Renderer ${rendererId}:`, renderer.rendererPackageName ?? 'unknown');

      const roots = hook.getFiberRoots?.(rendererId);
      if (!roots || roots.size === 0) {
        console.log(` No fiber roots found for renderer ${rendererId}`);
        continue;
      }

      roots.forEach((r: any) => traverse(r.current));
    }
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.display}>
        {count} : {letter}
      </Text>
      <Pressable style={styles.btn} onPress={incCount}>
        <Text style={styles.btnText}>+1</Text>
      </Pressable>

      <Pressable style={[styles.btn, { marginTop: 16 }]} onPress={incLetter}>
        <Text style={styles.btnText}>next letter</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#3c3c3c' },
  display: { fontSize: 100, marginBottom: 40, color: '#fff' },
  btn: { borderWidth: 2, borderRadius: 8, padding: 12, borderColor: '#fff' },
  btnText: { fontSize: 24, fontWeight: '600', color: '#fff' },
});
