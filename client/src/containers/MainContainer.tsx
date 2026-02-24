// src/containers/MainContainer.tsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { wsSend, getSocketReadyState } from '../transport/socket';
import SnapshotView from '../components/SnapshotView';
import TimelineControls from '../components/TimelineControls';
import MetricsPanel from '../components/MetricsPanel';

const WS_STATE_LABEL: Record<number, string> = { 0: 'CONNECTING…', 1: '✅ OPEN', 2: 'CLOSING…', 3: 'CLOSED' };
const WS_STATE_COLOR: Record<number, string> = { 0: '#f59e0b', 1: '#10b981', 2: '#f59e0b', 3: '#ef4444' };

// Inline debug component — remove when no longer needed
const ConnectionDebugger: React.FC = () => {
  const dispatch = useDispatch();
  const { snapshots, currentIndex } = useSelector((s: RootState) => s.snapshot);
  const { commits, lags, firstRenders } = useSelector((s: RootState) => s.metric);

  const [wsState, setWsState] = useState<number>(-1);
  useEffect(() => {
    const timer = setInterval(() => setWsState(getSocketReadyState()), 500);
    return () => clearInterval(timer);
  }, []);

  const sendTestSnapshot = () => {
    const testSnapshot = {
      channel: 'snapshot',
      type: 'add',
      payload: {
        id: `manual-test-${Date.now()}`,
        timestamp: Date.now(),
        component: 'TestComponent',
        props: { name: 'Manual Test' },
        state: { count: Math.floor(Math.random() * 100) }
      }
    };
    console.log('📤 Sending test snapshot:', testSnapshot);
    dispatch(wsSend(testSnapshot));
  };

  const sendTestCommitMetric = () => {
    const testMetric = {
      channel: 'metrics',
      type: 'commit',
      payload: {
        ts: Date.now(),
        durationMs: Math.random() * 50 + 10,
        fibersUpdated: Math.floor(Math.random() * 10) + 1,
        appId: 'debug-test'
      }
    };
    console.log('📊 Sending test metric:', testMetric);
    dispatch(wsSend(testMetric));
  };

  const sendTestLagMetric = () => {
    const testMetric = {
      channel: 'metrics',
      type: 'lag',
      payload: {
        ts: Date.now(),
        lagMs: Math.random() * 100 + 5,
        appId: 'debug-test'
      }
    };
    console.log('⏱️ Sending test lag metric:', testMetric);
    dispatch(wsSend(testMetric));
  };

  const sendTestFirstRenderMetric = () => {
    const testMetric = {
      channel: 'metrics',
      type: 'firstRender',
      payload: {
        ts: Date.now(),
        firstRenderMs: Math.random() * 2000 + 500,
        appId: 'debug-test'
      }
    };
    console.log('🚀 Sending test first render metric:', testMetric);
    dispatch(wsSend(testMetric));
  };

  const btnBase: React.CSSProperties = {
    display: 'block', width: '100%', marginBottom: 4,
    padding: '5px 8px', fontSize: 11,
    color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
  };

  const statsGrid: React.CSSProperties = {
    display: 'grid', gridTemplateColumns: '1fr 1fr',
    gap: '2px 8px', marginBottom: 8,
    color: '#94a3b8', fontSize: 11,
  };

  return (
    <div style={{
      position: 'fixed',
      top: 10,
      right: 10,
      background: '#1e293b',
      border: '1px solid #334155',
      borderRadius: 8,
      padding: '8px 10px',
      fontSize: 11,
      zIndex: 1000,
      maxWidth: 220,
      fontFamily: 'var(--font-sans)',
    }}>
      <h4 style={{ margin: '0 0 6px 0', color: '#f1f5f9', fontSize: 12, fontWeight: 600 }}>Debug Panel</h4>

      <div style={{ marginBottom: 6, padding: '3px 6px', borderRadius: 4, background: '#0f172a', fontWeight: 600, color: WS_STATE_COLOR[wsState] ?? '#6b7280' }}>
        WS: {WS_STATE_LABEL[wsState] ?? 'NO SOCKET'}
      </div>

      <div style={statsGrid}>
        <span>Snapshots:</span><span>{snapshots.length}</span>
        <span>Current:</span><span>{currentIndex}</span>
        <span>Commits:</span><span>{commits.length}</span>
        <span>Lags:</span><span>{lags.length}</span>
        <span>First Renders:</span><span>{firstRenders.length}</span>
      </div>

      <button onClick={sendTestSnapshot} style={{ ...btnBase, background: '#3b82f6' }}>
        Test Snapshot
      </button>

      <button onClick={sendTestCommitMetric} style={{ ...btnBase, background: '#10b981' }}>
        Test Commit Metric
      </button>

      <button onClick={sendTestLagMetric} style={{ ...btnBase, background: '#f59e0b' }}>
        Test Lag Metric
      </button>

      <button onClick={sendTestFirstRenderMetric} style={{ ...btnBase, background: '#8b5cf6', marginBottom: 0 }}>
        Test First Render
      </button>
    </div>
  );
};

const MainContainer: React.FC = () => {
  const { snapshots, currentIndex } = useSelector((s: RootState) => s.snapshot);
  const current = snapshots[currentIndex] ?? null;

  console.log('📦 snapshots:', snapshots);
  console.log('📍 currentIndex:', currentIndex);
  console.log('📸 current:', current);

  return (
    <>
      <ConnectionDebugger />

      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <main style={{ flex: 1, overflow: 'auto', display: 'grid', gridTemplateRows: '1fr auto' }}>
          <section style={{ padding: 16, overflow: 'auto', borderBottom: '1px solid #334155' }}>
            <SnapshotView
              snapshot={current}
              index={currentIndex}
              total={snapshots.length}
            />
          </section>

          <section style={{ padding: 16 }}>
            <MetricsPanel />
          </section>
        </main>

        <TimelineControls />
      </div>
    </>
  );
};

export default MainContainer;
