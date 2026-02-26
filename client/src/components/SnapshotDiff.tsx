import React from 'react';
import { diffSnapshots, type DiffNode, type DiffType } from '../utils/diffSnapshots';

export interface SnapshotDiffProps {
  prev: unknown;
  curr: unknown;
}

const DIFF_COLOR: Record<DiffType, string> = {
  added:     '#10b981',
  removed:   '#ef4444',
  changed:   '#f59e0b',
  unchanged: '#94a3b8',
};

const DIFF_PREFIX: Record<DiffType, string> = {
  added:     '+ ',
  removed:   '− ',
  changed:   '~ ',
  unchanged: '  ',
};

function formatValue(val: unknown): string {
  if (val === null) return 'null';
  if (val === undefined) return 'undefined';
  if (typeof val === 'string') return `"${val}"`;
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

interface DiffTreeProps {
  nodes: Record<string, DiffNode>;
  depth?: number;
}

const DiffTree: React.FC<DiffTreeProps> = ({ nodes, depth = 0 }) => {
  const indent = depth * 16;

  return (
    <>
      {Object.entries(nodes).map(([key, node]) => (
        <div key={key}>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 6,
              paddingLeft: indent,
              paddingTop: 2,
              paddingBottom: 2,
              color: DIFF_COLOR[node.type],
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
            <span aria-hidden="true" style={{ minWidth: 12, userSelect: 'none' }}>
              {DIFF_PREFIX[node.type]}
            </span>

            <span style={{ color: '#cbd5e1', marginRight: 4 }}>{key}:</span>

            {node.type === 'changed' && !node.children && (
              <span>
                <span style={{ color: '#ef4444', textDecoration: 'line-through', marginRight: 6 }}>
                  {formatValue(node.prevValue)}
                </span>
                <span style={{ color: '#10b981' }}>
                  {formatValue(node.nextValue)}
                </span>
              </span>
            )}

            {node.type === 'added' && (
              <span>{formatValue(node.nextValue)}</span>
            )}

            {node.type === 'removed' && (
              <span>{formatValue(node.prevValue)}</span>
            )}

            {node.type === 'unchanged' && !node.children && (
              <span>{formatValue(node.nextValue)}</span>
            )}

            {node.children && (
              <span style={{ color: '#475569' }}>{`{`}</span>
            )}
          </div>

          {node.children && (
            <>
              <DiffTree nodes={node.children} depth={depth + 1} />
              <div
                style={{
                  paddingLeft: indent,
                  color: '#475569',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: 13,
                }}
              >
                {`}`}
              </div>
            </>
          )}
        </div>
      ))}
    </>
  );
};

const SnapshotDiff: React.FC<SnapshotDiffProps> = ({ prev, curr }) => {
  if (prev === undefined || prev === null) {
    return (
      <div style={{ padding: '12px 0', color: '#94a3b8', fontFamily: 'var(--font-sans)', fontSize: 13 }}>
        First snapshot — no previous state to compare.
      </div>
    );
  }

  const nodes = diffSnapshots(prev, curr);
  const hasChanges = Object.values(nodes).some((n) => n.type !== 'unchanged');

  return (
    <div>
      {!hasChanges && (
        <div style={{ marginBottom: 8, color: '#94a3b8', fontFamily: 'var(--font-sans)', fontSize: 12 }}>
          No changes from previous snapshot.
        </div>
      )}

      <div
        role="region"
        aria-label="Snapshot diff"
        style={{
          background: '#0f172a',
          border: '1px solid #334155',
          borderRadius: 6,
          padding: '10px 12px',
          overflow: 'auto',
          maxHeight: 300,
        }}
      >
        <div style={{ display: 'flex', gap: 16, marginBottom: 8, fontFamily: 'var(--font-sans)', fontSize: 11, color: '#64748b' }}>
          <span><span style={{ color: '#10b981' }}>+</span> added</span>
          <span><span style={{ color: '#ef4444' }}>−</span> removed</span>
          <span><span style={{ color: '#f59e0b' }}>~</span> changed</span>
        </div>
        <DiffTree nodes={nodes} />
      </div>
    </div>
  );
};

export default SnapshotDiff;
