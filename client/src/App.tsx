import React, { useState, useEffect, useRef } from 'react';
import MainContainer from './containers/MainContainer';

function App(): React.JSX.Element {
  // adding the Websocket connection in our top level React component where we can use hooks (so not main.tsx)
  // I think this will be temporary for the MVP demo, until we figure out how to integrate Redux into the pipeline
  const [messages, setMessages] = useState<any[]>([]);
  const websocketStarted = useRef(false); // apparently we need a useRef here to avoid opening a new WS connection on re-renders

  useEffect(() => {
    console.log('hi useEffect test in App.tsx');

    if (websocketStarted.current) return; // if a WS connection is already open, just exit
    // else
    websocketStarted.current = true;

    const ws = new WebSocket('ws://localhost:8080'); // we probably should make a single imported Port variable

    ws.onopen = () => console.log('browser UI websockets connected');
    ws.onmessage = (e) => {
      console.log('e', e);
      console.log('e.data', e.data);
      try {
        const data = JSON.parse(e.data);
        console.log('data parsed from browser UI websockets connection:', data);
        setMessages((prev) => [...prev, data]); // if we simply push the new data to our state array, it won't trigger a re-render
      } catch {
        console.log('unable to parse non-JSON data:', e.data, 'e',);
      }
    };
    ws.onerror = (e) => console.error('browser UI websockets error:', e);
    ws.onclose = (e) => console.log('browser UI websockets closed', e.code, e.reason);
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: '#f1f5f9' }}>
      <MainContainer snapshotArray={messages} />
    </div>
  );
}

export default App;

// // src/App.tsx
// import React from 'react';
// import { Provider } from 'react-redux';
// import { store } from './store/store';
// import MainContainer from './containers/MainContainer';
// import { ThemeProvider } from './ThemeProvider'; // Optional

// function App(): React.JSX.Element {
//   return (
//     <Provider store={store}>
//       <MainContainer />
//     </Provider>
//   );
// }

// export default App;

/**
 * <Provider store={store}>
      <ThemeProvider>
        <MainContainer />
      </ThemeProvider>
    </Provider>
 */
