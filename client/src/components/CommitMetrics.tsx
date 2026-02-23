import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';

/**
 * CommitMetrics
 * Shows basic stats and a table of recent React commit durations.
 * Data source: state.metric.commits (array of { ts, durationMs, fibersUpdated?, appId? })
 */
const CommitMetrics: React.FC = () => {
  const commits = useSelector((s: RootState) => s.metric.commits);

  const stats = useMemo(() => {
    if (!commits.length) return null;
    const durations = commits.map(c => c.durationMs);
    const count = durations.length;
    const sum = durations.reduce((a, b) => a + b, 0);
    const avg = sum / count;
    const p95 = percentile(durations, 95);
    const max = Math.max(...durations);
    const min = Math.min(...durations);
    return { count, avg, p95, max, min };
  }, [commits]);

  if (!commits.length) {
    return <Empty title="Commit Durations" hint="Waiting for commit metrics from RN agent…" />;
  }

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Commit Durations (ms)</h3>
      <ul style={listStyle}>
        <li><strong>Samples:</strong> {stats!.count}</li>
        <li><strong>Avg:</strong> {stats!.avg.toFixed(1)} ms</li>
        <li><strong>P95:</strong> {stats!.p95.toFixed(1)} ms</li>
        <li><strong>Min / Max:</strong> {stats!.min.toFixed(1)} / {stats!.max.toFixed(1)} ms</li>
      </ul>

      <table style={tableStyle}>
        <thead>
  <tr>
    <th style={thStyle}>When</th>
    <th style={thStyle}>Duration (ms)</th>
    <th style={thStyle}>Fibers</th>
    <th style={thStyle}>App</th>
  </tr>
</thead>
<tbody>
  {commits.slice(-20).reverse().map((c, i) => (
    <tr key={i}>
      <td style={tdStyle}>{formatTime(c.ts)}</td>
      <td style={tdStyle}>{c.durationMs.toFixed(1)}</td>
      <td style={tdStyle}>{c.fibersUpdated ?? '—'}</td>
      <td style={tdStyle}>{c.appId ?? '—'}</td>
    </tr>
  ))}
</tbody>
      </table>
      <small>Showing latest 20.</small>
    </div>
  );
};

const Empty: React.FC<{ title: string; hint?: string }> = ({ title, hint }) => (
  <div>
    <h3 style={{ marginTop: 0 }}>{title}</h3>
    <p style={{ margin: 0, color: '#6b7280' }}>{hint ?? 'No data yet.'}</p>
  </div>
);

function percentile(values: number[], p: number) {
  const arr = [...values].sort((a, b) => a - b);
  if (!arr.length) return 0;
  const idx = Math.min(arr.length - 1, Math.max(0, Math.ceil((p / 100) * arr.length) - 1));
  return arr[idx];
}

function formatTime(ts: number) {
  try {
    return new Date(ts).toLocaleTimeString();
  } catch {
    return String(ts);
  }
}

const listStyle: React.CSSProperties = { 
  display: 'flex', 
  gap: 16, 
  listStyle: 'none', 
  paddingLeft: 0, 
  margin: '8px 0' 
};

const tableStyle: React.CSSProperties = { 
  width: '100%', 
  borderCollapse: 'collapse',
  fontSize: '14px'
};

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '8px 12px',
  borderBottom: '2px solid #e5e7eb',
  fontWeight: '600',
};

const tdStyle: React.CSSProperties = {
  padding: '6px 12px',
  borderBottom: '1px solid #e5e7eb',
  fontFamily: 'monospace'
};
export default CommitMetrics;
