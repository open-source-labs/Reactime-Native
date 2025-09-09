import React, { useEffect, useRef, useState } from 'react';
import { View, Button, Text, StyleSheet, Pressable } from 'react-native';
import Constants from 'expo-constants';
import { logFiber, traverse } from './useFiberTree';

/** Compute laptop IP so the phone can reach ws://<IP>:8080 */
// const devHost =
//   (Constants.manifest2 as any)?.extra?.expoGo?.developerHostname || // SDK 50
//   Constants.manifest?.debuggerHost?.split(':')[0] || // older SDK
//   'localhost'; // fallback

const devHost = '192.168.1.67'; // 

// ADDED: Helper function to extract component data for Reactime
function extractComponentSnapshot(fiberRoot: any): any {
  const components: any[] = [];
  
  function walkFiber(node: any) {
    if (!node) return;
    
    const tag = node.tag;
    if (tag === 0 || tag === 1 || tag === 2 || tag === 10) { // Function/Class components
      const name = node.elementType?.name || node.elementType?.displayName || 'Anonymous';
      
      // Extract state if available
      let state = {};
      if (node.memoizedState) {
        // Simple state extraction - you can make this more sophisticated
        try {
          state = {
            hasState: true,
            memoizedState: node.memoizedState.memoizedState || 'no memoized state'
          };
        } catch (e) {
          state = { hasState: true, error: 'Could not serialize state' };
        }
      }
      
      components.push({
        name,
        tag,
        key: node.key,
        state,
        props: node.memoizedProps || {}
      });
    }
    
    walkFiber(node.child);
    walkFiber(node.sibling);
  }
  
  walkFiber(fiberRoot);
  return {
    timestamp: Date.now(),
    componentTree: components,
    rootInfo: {
      type: 'ReactNativeApp',
      children: components.length
    }
  };
}

export default function App() {
  const [count, setCount] = useState(0);
  const [letter, setLetter] = useState('a');

  const ws = useRef<WebSocket | null>(null);

  /* open WebSocket once */
  useEffect(() => {
    const socket = new WebSocket(`ws://${devHost}:8080`);
    ws.current = socket;

    socket.onopen = () => {
      console.log('🔌 WS connected');
      // CHANGED: Send proper control message instead of raw state
      socket.send(JSON.stringify({
        channel: 'control',
        type: 'ping'
      }));
    };
    socket.onerror = (e) => {
      console.log('WS error', (e as any).message ?? e);
    };
    socket.onclose = () => console.log('WS closed');

    return () => socket.close();
  }, []);

  /* CHANGED: helper to send snapshot data to Reactime */
  const sendSnapshot = (currentFiberRoot?: any) => {
    const socket = ws.current;
    if (socket?.readyState !== WebSocket.OPEN) return;

    // If we have a fiber root, extract component data
    let snapshotData;
    if (currentFiberRoot) {
      snapshotData = extractComponentSnapshot(currentFiberRoot);
    } else {
      // Fallback: send current component state
      snapshotData = {
        timestamp: Date.now(),
        appState: { count, letter },
        components: [
          {
            name: 'App',
            state: { count, letter },
            type: 'FunctionComponent'
          }
        ]
      };
    }

    // CHANGED: Send in the format your browser client expects
    const message = {
      channel: 'snapshot',
      type: 'add',
      payload: snapshotData
    };

    socket.send(JSON.stringify(message));
    console.log('📤 Sent snapshot to Reactime');
  };

  /* ADDED: helper to send performance metrics */
  const sendMetric = () => {
    const socket = ws.current;
    if (socket?.readyState !== WebSocket.OPEN) return;

    const metric = {
      channel: 'metrics',
      type: 'commit',
      payload: {
        ts: Date.now(),
        durationMs: Math.random() * 20 + 5, // Simulated commit duration
        fibersUpdated: Math.floor(Math.random() * 5) + 1,
        appId: 'react-native-sample'
      }
    };

    socket.send(JSON.stringify(metric));
    console.log('📊 Sent metric to Reactime');
  };

  // CHANGED: helper to broadcast the current state (now sends proper snapshot format)
  const emit = (nextCount: number, nextLetter: string) => {
    // Send snapshot after state update
    setTimeout(() => sendSnapshot(), 10);
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
      console.log('❌ DevTools hook not found');
      return;
    }

    console.log('✅ DevTools hook found!', Object.keys(hook));

    /* CHANGED: Send snapshot on every React commit */
    hook.onCommitFiberRoot = (_id: any, root: any) => {
      logFiber(root.current); // Keep your existing logging
      sendSnapshot(root.current); // ADDED: Send snapshot to Reactime
      sendMetric(); // ADDED: Send performance metric
    };

    /* 2. Walk existing trees once for an initial dump */
    const renderers = hook.renderers;
    if (!renderers || renderers.size === 0) {
      console.log('⚠️ No renderers found.');
      return;
    }

    for (const [rendererId, renderer] of renderers) {
      console.log(`🔧 Renderer ${rendererId}:`, renderer.rendererPackageName ?? 'unknown');

      const roots = hook.getFiberRoots?.(rendererId);
      if (!roots || roots.size === 0) {
        console.log(`⚠️ No fiber roots found for renderer ${rendererId}`);
        continue;
      }

      // ADDED: Send initial snapshot
      roots.forEach((r: any) => {
        traverse(r.current); // Keep your existing traversal
        sendSnapshot(r.current); // ADDED: Send initial snapshot
      });
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


// import React, { useEffect, useRef, useState } from 'react';
// import { View, Button, Text, StyleSheet, Pressable } from 'react-native';
// import Constants from 'expo-constants';
// import { logFiber, traverse } from './useFiberTree';

// /** Compute laptop IP so the phone can reach ws://<IP>:8080 */
// // const devHost =
// //   (Constants.manifest2 as any)?.extra?.expoGo?.developerHostname || // SDK 50
// //   Constants.manifest?.debuggerHost?.split(':')[0] || // older SDK
// //   'localhost'; // fallback

// const devHost = '192.168.1.67'; // 

// export default function App() {
//   const [count, setCount] = useState(0);
//   const [letter, setLetter] = useState('a');

//   const ws = useRef<WebSocket | null>(null);

//   /* open WebSocket once */
//   useEffect(() => {
//     const socket = new WebSocket(`ws://${devHost}:8080`);
//     ws.current = socket;

//     socket.onopen = () => {
//       console.log('🔌 WS connected');
//       socket.send(
//         JSON.stringify({
//           count: count,
//           letter: letter,
//           timestamp: new Date().toISOString(),
//         })
//       );
//     };
//     socket.onerror = (e) => {
//       console.log('WS error', (e as any).message ?? e);
//     };
//     socket.onclose = () => console.log('WS closed');

//     return () => socket.close();
//   }, []);

//   /* helper to broadcast the current state */
//   const emit = (nextCount: number, nextLetter: string) => {
//     const socket = ws.current;
//     if (socket?.readyState === WebSocket.OPEN) {
//       socket.send(
//         JSON.stringify({
//           count: nextCount,
//           letter: nextLetter,
//           timestamp: new Date().toISOString(),
//         })
//       );
//     }
//   };

//   const incCount = () =>
//     setCount((e) => {
//       const n = e + 1;
//       emit(n, letter);
//       return n;
//     });

//   const incLetter = () =>
//     setLetter((e) => {
//       const n = String.fromCharCode(((e.charCodeAt(0) - 97 + 1) % 26) + 97);
//       emit(count, n);
//       return n;
//     });

//   useEffect(() => {
//     const hook = (globalThis as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
//     if (!hook) {
//       console.log('❌ DevTools hook not found');
//       return;
//     }

//     console.log('✅ DevTools hook found!', Object.keys(hook));

//     /* 1. Stream every commit through logFiber */
//     hook.onCommitFiberRoot = (_id: any, root: any) => {
//       logFiber(root.current);
//     };

//     /* 2. Walk existing trees once for an initial dump */
//     const renderers = hook.renderers;
//     if (!renderers || renderers.size === 0) {
//       console.log('⚠️ No renderers found.');
//       return;
//     }

//     for (const [rendererId, renderer] of renderers) {
//       console.log(`🔧 Renderer ${rendererId}:`, renderer.rendererPackageName ?? 'unknown');

//       const roots = hook.getFiberRoots?.(rendererId);
//       if (!roots || roots.size === 0) {
//         console.log(`⚠️ No fiber roots found for renderer ${rendererId}`);
//         continue;
//       }

//       roots.forEach((r: any) => traverse(r.current));
//     }
//   }, []);

//   return (
//     <View style={styles.container}>
//       <Text style={styles.display}>
//         {count} : {letter}
//       </Text>
//       <Pressable style={styles.btn} onPress={incCount}>
//         <Text style={styles.btnText}>+1</Text>
//       </Pressable>

//       <Pressable style={[styles.btn, { marginTop: 16 }]} onPress={incLetter}>
//         <Text style={styles.btnText}>next letter</Text>
//       </Pressable>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#3c3c3c' },
//   display: { fontSize: 100, marginBottom: 40, color: '#fff' },
//   btn: { borderWidth: 2, borderRadius: 8, padding: 12, borderColor: '#fff' },
//   btnText: { fontSize: 24, fontWeight: '600', color: '#fff' },
// });
