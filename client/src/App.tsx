import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import MainContainer from './containers/MainContainer';
import { wsConnect, wsDisconnect } from './transport/socket';

function App(): React.JSX.Element {
  const dispatch = useDispatch();

  useEffect(() => {
    console.log('App mounted, connecting to WebSocket...');
    dispatch(wsConnect('ws://localhost:8080'));
    return () => {
      console.log('App unmounting, disconnecting WebSocket...');
      dispatch(wsDisconnect());
    };
  }, [dispatch]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: '#f1f5f9', fontFamily: 'var(--font-sans)' }}>
      <MainContainer />
    </div>
  );
}

export default App;
