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
      background: '#1e293b',
      padding: '12px 10px',
      fontSize: 11,
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

const TAB_ORDER: SnapshotTab[] = ['snapshot', 'diff', 'tree'];
const TAB_IDS: Record<SnapshotTab, string> = {
  snapshot: 'tab-snapshot',
  diff:     'tab-diff',
  tree:     'tab-tree',
};

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

  const handleTabKeyDown = (e: React.KeyboardEvent, tab: SnapshotTab) => {
    const idx = TAB_ORDER.indexOf(tab);
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const next = TAB_ORDER[(idx + 1) % TAB_ORDER.length];
      setActiveTab(next);
      document.getElementById(TAB_IDS[next])?.focus();
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevTab = TAB_ORDER[(idx - 1 + TAB_ORDER.length) % TAB_ORDER.length];
      setActiveTab(prevTab);
      document.getElementById(TAB_IDS[prevTab])?.focus();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <main style={{ flex: 1, overflow: 'hidden', display: 'grid', gridTemplateRows: '1fr auto 1fr' }}>

        {/* Top half: debug panel + snapshot views side by side */}
        <div style={{ display: 'flex', overflow: 'hidden', borderBottom: '1px solid #334155' }}>

          {/* Debug panel column — remove this div when debug panel is retired */}
          <div style={{ width: 200, flexShrink: 0, background: '#0f172a', borderRight: '1px solid #334155' }}>
            <ConnectionDebugger />
          </div>

          {/* Snapshot tabs + content */}
          <section style={{ flex: 1, padding: 16, overflow: 'auto' }}>
            <div
              role="tablist"
              aria-label="Snapshot views"
              style={{ display: 'flex', gap: 0, borderBottom: '1px solid #334155', marginBottom: 12 }}
            >
              <button
                id={TAB_IDS['snapshot']}
                role="tab"
                aria-selected={activeTab === 'snapshot'}
                tabIndex={activeTab === 'snapshot' ? 0 : -1}
                style={tabBtn('snapshot')}
                onClick={() => setActiveTab('snapshot')}
                onKeyDown={(e) => handleTabKeyDown(e, 'snapshot')}
              >
                Snapshot
              </button>
              <button
                id={TAB_IDS['diff']}
                role="tab"
                aria-selected={activeTab === 'diff'}
                tabIndex={activeTab === 'diff' ? 0 : -1}
                style={tabBtn('diff')}
                onClick={() => setActiveTab('diff')}
                onKeyDown={(e) => handleTabKeyDown(e, 'diff')}
              >
                Diff
              </button>
              <button
                id={TAB_IDS['tree']}
                role="tab"
                aria-selected={activeTab === 'tree'}
                tabIndex={activeTab === 'tree' ? 0 : -1}
                style={tabBtn('tree')}
                onClick={() => setActiveTab('tree')}
                onKeyDown={(e) => handleTabKeyDown(e, 'tree')}
              >
                Tree
              </button>
            </div>

            {activeTab === 'snapshot' && (
              <div role="tabpanel" aria-labelledby={TAB_IDS['snapshot']}>
                <SnapshotView
                  snapshot={current}
                  index={currentIndex}
                  total={snapshots.length}
                />
              </div>
            )}
            {activeTab === 'diff' && (
              <div role="tabpanel" aria-labelledby={TAB_IDS['diff']}>
                <SnapshotDiff prev={prev} curr={current} />
              </div>
            )}
            {activeTab === 'tree' && (
              <div role="tabpanel" aria-labelledby={TAB_IDS['tree']}>
                <ComponentTree snapshot={current} prevSnapshot={prev} />
              </div>
            )}
          </section>
        </div>

        {/* Scrubber — auto row, never shrinks */}
        <TimelineControls />

        {/* Bottom third: metrics */}
        <section style={{ padding: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <MetricsPanel />
        </section>

      </main>
    </div>
  );
};

export default MainContainer;
