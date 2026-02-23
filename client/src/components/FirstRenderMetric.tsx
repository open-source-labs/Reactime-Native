import React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';

/**
 * FirstRenderMetric
 * Shows the latest Time-to-First-Screen-Render (ms).
 * Data source: state.metric.firstRenders (array of { ts, firstRenderMs, appId? })
 */
const FirstRenderMetric: React.FC = () => {
  const firstRenders = useSelector((s: RootState) => s.metric.firstRenders);
  const latest = firstRenders.length ? firstRenders[firstRenders.length - 1] : null;

  if (!latest) {
    return <Empty title="First Screen Render" hint="Waiting for first-render measurement…" />;
  }

  const badgeColor = colorForFirstRender(latest.firstRenderMs);

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>First Screen Render</h3>
      <div style={row}>
        <span style={badge(badgeColor)}>{latest.firstRenderMs.toFixed(0)} ms</span>
        <span style={{ color: '#6b7280', marginLeft: 8 }}>{new Date(latest.ts).toLocaleTimeString()}</span>
      </div>
      {latest.appId ? <small style={{ color: '#6b7280' }}>App: {latest.appId}</small> : null}
    </div>
  );
};

const Empty: React.FC<{ title: string; hint?: string }> = ({ title, hint }) => (
  <div>
    <h3 style={{ marginTop: 0 }}>{title}</h3>
    <p style={{ margin: 0, color: '#6b7280' }}>{hint ?? 'No data yet.'}</p>
  </div>
);

// naive color bands; tweak thresholds as you like
function colorForFirstRender(v: number) {
  if (v < 1500) return '#16a34a';   // green
  if (v < 2500) return '#ca8a04';   // yellow
  return '#dc2626';                 // red
}

const row: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8 };
const badge = (bg: string): React.CSSProperties => ({
  display: 'inline-block',
  padding: '6px 10px',
  borderRadius: 6,
  background: bg,
  color: 'white',
  fontWeight: 600,
});
export default FirstRenderMetric;
