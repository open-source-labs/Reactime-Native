// src/components/SnapshotView.tsx
import React from 'react';

export interface SnapshotViewProps {
  snapshot: unknown;
  index: number;
  total: number;
}

const SnapshotView: React.FC<SnapshotViewProps> = ({ snapshot, index, total }) => {
  return (
    <div style={{ padding: 12, border: '1px solid #334155', borderRadius: 8, marginTop: 12 }}>
      <h3 style={{ margin: 0, color: '#f1f5f9' }}>Snapshot View</h3>

      <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>
        Total: {total} | Index: {index}
      </div>

      <pre style={{ background: '#0f172a', color: '#e2e8f0', fontFamily: 'var(--font-mono, monospace)', fontSize: 13, padding: 10, borderRadius: 6, border: '1px solid #334155', overflow: 'auto', maxHeight: 260, margin: 0 }}>
        {snapshot ? JSON.stringify(snapshot, null, 2) : 'No snapshot selected'}
      </pre>
    </div>
  );
};

export default SnapshotView;
