import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import MainContainer from './containers/MainContainer';
// CHANGE: Fixed import to use socket.ts instead of wsActions.ts for middleware compatibility
import { wsConnect, wsDisconnect } from './transport/socket';

function App(): React.JSX.Element {
  const dispatch = useDispatch();

  // we might want the websockets connection in a separate file like websocketsBridge, just to keep App.tsx frontend UI only
  useEffect(() => {
    console.log('🚀 App mounted, connecting to WebSocket...'); // ADDED: Debug logging
    dispatch(wsConnect('ws://localhost:8080'));
    return () => {
      console.log('🔌 App unmounting, disconnecting WebSocket...'); // ADDED: Debug logging
      dispatch(wsDisconnect());
    };
  }, [dispatch]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: '#f1f5f9' }}>
      <MainContainer />
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
