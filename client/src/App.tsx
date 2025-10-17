import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import MainContainer from './containers/MainContainer';
import { wsConnect, wsDisconnect } from './transport/wsActions';

function App(): React.JSX.Element {
  const dispatch = useDispatch();

  // we might want the websockets connection in a separate file like websocketsBridge, just to keep App.tsx frontend UI only
  useEffect(() => {
    dispatch(wsConnect('ws://localhost:8080'));
    return () => {
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

