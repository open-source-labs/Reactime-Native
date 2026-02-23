// src/containers/MainContainer.tsx
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { wsSend } from '../transport/socket';
import SnapshotView from '../components/SnapshotView';
import TimelineSlider from '../components/TimelineSlider';
import MetricsPanel from '../components/MetricsPanel';

// Inline debug component — remove when no longer needed
const ConnectionDebugger: React.FC = () => {
  const dispatch = useDispatch();
  const { snapshots, currentIndex } = useSelector((s: RootState) => s.snapshot);
  const { commits, lags, firstRenders } = useSelector((s: RootState) => s.metric);

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
    dispatch(wsSend(testMetric));
  };

  return (
    <div style={{
      position: 'fixed',
      top: 10,
      right: 10,
      background: '#1e293b',
      border: '1px solid #334155',
      borderRadius: 8,
      padding: 8,
      fontSize: 10,
      zIndex: 1000,
      maxWidth: 200
    }}>
      <h4 style={{ margin: '0 0 8px 0', color: '#f1f5f9' }}>🔧 Debug Panel</h4>

      <div style={{ marginBottom: 8, color: '#94a3b8' }}>
        📦 Snapshots: {snapshots.length}<br/>
        📍 Current: {currentIndex}<br/>
        📊 Commits: {commits.length}<br/>
        📈 Lags: {lags.length}<br/>
        🎯 First Renders: {firstRenders.length}
      </div>

      <button onClick={sendTestSnapshot} style={{ display: 'block', width: '100%', marginBottom: 4, padding: 4, fontSize: 10, background: '#3b82f6', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
        📤 Send Test Snapshot
      </button>

      <button onClick={sendTestCommitMetric} style={{ display: 'block', width: '100%', marginBottom: 4, padding: 4, fontSize: 10, background: '#10b981', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
        📊 Send Test Commit Metric
      </button>

      <button onClick={sendTestLagMetric} style={{ display: 'block', width: '100%', marginBottom: 4, padding: 4, fontSize: 10, background: '#f59e0b', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
        ⏱️ Send Test Lag Metric
      </button>

      <button onClick={sendTestFirstRenderMetric} style={{ display: 'block', width: '100%', marginBottom: 4, padding: 4, fontSize: 10, background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
        🚀 Send Test First Render Metric
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

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16, height: '100vh' }}>
        <aside style={{ padding: 12, borderRight: '1px solid #eee' }}>
          <h3 style={{ margin: '8px 0 12px' }}>Timeline</h3>
          <TimelineSlider />
        </aside>

        <main style={{ display: 'grid', gridTemplateRows: '1fr auto', gap: 16 }}>
          <section style={{ padding: 12, overflow: 'auto', borderBottom: '1px solid #eee' }}>
            <SnapshotView
              snapshot={current}
              index={currentIndex}
              total={snapshots.length}
            />
          </section>

          <section style={{ padding: 12 }}>
            <MetricsPanel />
          </section>
        </main>
      </div>
    </>
  );
};

export default MainContainer;
