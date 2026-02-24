
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { wsConnect, wsSend } from '../transport/socket';
import type { RootState } from '../store/store';

const WebSocketDebugger: React.FC = () => {
  const dispatch = useDispatch();
  const snapshots = useSelector((state: RootState) => state.snapshot.snapshots);
  
  useEffect(() => {
    // Connect to WebSocket on component mount
    console.log('🔌 Connecting to WebSocket...');
    dispatch(wsConnect());
    
    // Send a test snapshot after 2 seconds
    setTimeout(() => {
      console.log('📤 Sending test snapshot...');
      dispatch(wsSend({
        channel: 'snapshot',
        type: 'add',
        payload: {
          testData: 'Hello from client',
          timestamp: Date.now(),
          components: ['TestComponent1', 'TestComponent2']
        }
      }));
    }, 2000);
  }, [dispatch]);

  const sendTestSnapshot = () => {
    const testSnapshot = {
      channel: 'snapshot',
      type: 'add',
      payload: {
        id: Math.random(),
        timestamp: Date.now(),
        state: {
          testComponent: {
            props: { name: 'Test' },
            state: { count: Math.floor(Math.random() * 100) }
          }
        }
      }
    };
    
    console.log('📤 Sending manual test snapshot:', testSnapshot);
    dispatch(wsSend(testSnapshot));
  };

  return (
    <div style={{ padding: 16, border: '2px solid #007acc', margin: 16 }}>
      <h3>🔧 WebSocket Debugger</h3>
      <p>Snapshots in store: {snapshots.length}</p>
      <button onClick={sendTestSnapshot} style={{ padding: 8, margin: 4 }}>
        Send Test Snapshot
      </button>
      <button onClick={() => dispatch(wsConnect())} style={{ padding: 8, margin: 4 }}>
        Reconnect WebSocket
      </button>
      <pre style={{ background: '#f5f5f5', padding: 8, fontSize: 12 }}>
        {JSON.stringify(snapshots, null, 2)}
      </pre>
    </div>
  );
};

export default WebSocketDebugger;