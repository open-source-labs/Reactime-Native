// src/components/SnapshotView.tsx
import React from 'react';

export interface SnapshotViewProps {
  snapshot: unknown;
  index: number;
  total: number;
}

const SnapshotView: React.FC<SnapshotViewProps> = ({ snapshot, index, total }) => {
  return (
    <div style={{ padding: 12, border: '1px solid #e5e5e5', marginTop: 12 }}>
      <h3 style={{ margin: 0 }}>Snapshot View</h3>

      <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>
        Total: {total} | Index: {index}
      </div>

      <pre style={{ background: '#0b1a33', color: 'white', padding: 10, overflow: 'auto', maxHeight: 260 }}>
        {snapshot ? JSON.stringify(snapshot, null, 2) : 'No snapshot selected'}
      </pre>
    </div>
  );
};

export default SnapshotView;
