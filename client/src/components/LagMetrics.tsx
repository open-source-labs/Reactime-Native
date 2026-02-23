import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';

/**
 * LagMetrics
 * Displays event-loop lag samples (ms) coming from RN device.
 * Data source: state.metric.lags (array of { ts, lagMs, appId? })
 */
const LagMetrics: React.FC = () => {
  const lags = useSelector((s: RootState) => s.metric.lags);

  const stats = useMemo(() => {
    if (!lags.length) return null;
    const values = lags.map(l => l.lagMs);
    const count = values.length;
    const max = Math.max(...values);
    const avg = values.reduce((a, b) => a + b, 0) / count;
    return { count, avg, max };
  }, [lags]);

  if (!lags.length) {
    return <Empty title="Event-Loop Lag" hint="Waiting for lag samples from RN agent…" />;
  }

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Event-Loop Lag (ms)</h3>
      <ul style={listStyle}>
        <li><strong>Samples:</strong> {stats!.count}</li>
        <li><strong>Avg:</strong> {stats!.avg.toFixed(1)} ms</li>
        <li><strong>Max:</strong> {stats!.max.toFixed(1)} ms</li>
      </ul>

      <ol style={olStyle}>
        {lags.slice(-10).reverse().map((l, i) => (
          <li key={i}>
            <span style={{ display: 'inline-block', width: 96 }}>{formatTime(l.ts)}</span>
            <strong>{l.lagMs.toFixed(1)} ms</strong>
            {l.appId ? <span style={{ color: '#6b7280' }}> • {l.appId}</span> : null}
          </li>
        ))}
      </ol>
      <small>Showing latest 10.</small>
    </div>
  );
};

const Empty: React.FC<{ title: string; hint?: string }> = ({ title, hint }) => (
  <div>
    <h3 style={{ marginTop: 0 }}>{title}</h3>
    <p style={{ margin: 0, color: '#6b7280' }}>{hint ?? 'No data yet.'}</p>
  </div>
);

function formatTime(ts: number) {
  try {
    return new Date(ts).toLocaleTimeString();
  } catch {
    return String(ts);
  }
}

const listStyle: React.CSSProperties = { display: 'flex', gap: 16, listStyle: 'none', paddingLeft: 0, margin: '8px 0' };
const olStyle: React.CSSProperties = { margin: '8px 0 0 16px' };
export default LagMetrics;
