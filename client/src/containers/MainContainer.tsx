// src/containers/MainContainer.tsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { wsSend, getSocketReadyState } from '../transport/socket';
import SnapshotView from '../components/SnapshotView';
import SnapshotDiff from '../components/SnapshotDiff';
import ComponentTree from '../components/ComponentTree';
import TimelineControls from '../components/TimelineControls';
import MetricsPanel from '../components/MetricsPanel';

const WS_STATE_LABEL: Record<number, string>  = { [-1]: 'No WebSocket', 0: ' WS Connecting', 1: 'WS Connected', 2: 'WS Closing', 3: 'WS Closed' };
const WS_STATE_COLOR: Record<number, string>  = { [-1]: '#ef4444',  0: '#f59e0b',    1: '#10b981',   2: '#f59e0b',  3: '#ef4444' };
// Contrast ratios on #0f172a bg: red 4.75:1 ✓  amber 8.30:1 ✓  green 7.05:1 ✓  (WCAG AA 4.5:1)

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

      <div
        role="status"
        aria-label={`WebSocket status: ${WS_STATE_LABEL[wsState] ?? 'No Socket'}`}
        style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, padding: '3px 6px', borderRadius: 4, background: '#0f172a' }}
      >
        <span
          aria-hidden="true"
          style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: WS_STATE_COLOR[wsState] ?? '#ef4444', flexShrink: 0 }}
        />
        <span style={{ fontWeight: 600, color: WS_STATE_COLOR[wsState] ?? '#ef4444' }}>
          {WS_STATE_LABEL[wsState] ?? 'No Socket'}
        </span>
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

type SnapshotTab = 'snapshot' | 'diff' | 'tree';

const MainContainer: React.FC = () => {
  const { snapshots, currentIndex } = useSelector((s: RootState) => s.snapshot);
  const current = snapshots[currentIndex] ?? null;
  const prev    = snapshots[currentIndex - 1] ?? null;

  const [activeTab, setActiveTab] = useState<SnapshotTab>('snapshot');

  const tabBtn = (tab: SnapshotTab): React.CSSProperties => ({
    padding: '4px 12px',
    fontSize: 12,
    fontFamily: 'var(--font-sans)',
    fontWeight: activeTab === tab ? 600 : 400,
    color: activeTab === tab ? '#14b8a6' : '#94a3b8',
    background: 'transparent',
    border: 'none',
    borderBottom: activeTab === tab ? '2px solid #14b8a6' : '2px solid transparent',
    cursor: 'pointer',
    transition: 'color var(--transition), border-color var(--transition)',
  });

  return (
    <>
      <ConnectionDebugger />

      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <main style={{ flex: 1, overflow: 'auto', display: 'grid', gridTemplateRows: '1fr auto' }}>
          <section style={{ padding: 16, overflow: 'auto', borderBottom: '1px solid #334155' }}>
            <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #334155', marginBottom: 12 }}>
              <button
                style={tabBtn('snapshot')}
                onClick={() => setActiveTab('snapshot')}
                aria-pressed={activeTab === 'snapshot'}
              >
                Snapshot
              </button>
              <button
                style={tabBtn('diff')}
                onClick={() => setActiveTab('diff')}
                aria-pressed={activeTab === 'diff'}
              >
                Diff
              </button>
              <button
                style={tabBtn('tree')}
                onClick={() => setActiveTab('tree')}
                aria-pressed={activeTab === 'tree'}
              >
                Tree
              </button>
            </div>

            {activeTab === 'snapshot' && (
              <SnapshotView
                snapshot={current}
                index={currentIndex}
                total={snapshots.length}
              />
            )}
            {activeTab === 'diff' && (
              <SnapshotDiff prev={prev} curr={current} />
            )}
            {activeTab === 'tree' && (
              <ComponentTree snapshot={current} prevSnapshot={prev} />
            )}
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
