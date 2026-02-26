import React from 'react';
import CommitMetrics from './CommitMetrics';
import LagMetrics from './LagMetrics.tsx';
import FirstRenderMetric from './FirstRenderMetric';

/**
 * MetricsPanel
 * Parent container that lays out all metric visualizations
 * (commit durations, event-loop lag samples, and first-screen render).
 */
const MetricsPanel: React.FC = () => {
  return (
    <section style={styles.panel}>
      <h2 style={styles.h2}>Performance Metrics</h2>

      <div style={styles.row}>
        <div style={styles.card}>
          <FirstRenderMetric />
        </div>

        <div style={styles.card}>
          <LagMetrics />
        </div>
      </div>

      <div style={styles.cardWide}>
        <CommitMetrics />
      </div>
    </section>
  );
};

const styles: Record<string, React.CSSProperties> = {
  panel: { display: 'flex', flexDirection: 'column', gap: 16, flex: 1, minHeight: 0, overflow: 'hidden' },
  h2: { margin: 0 },
  row: { display: 'flex', gap: 16, flexWrap: 'wrap' },
  card: { flex: '1 1 320px', border: '1px solid #334155', borderRadius: 8, padding: 12, backgroundColor: '#1e293b' },
  cardWide: { border: '1px solid #334155', borderRadius: 8, padding: 12, backgroundColor: '#1e293b', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
};

export default MetricsPanel;
