import React, { useState } from 'react';
import { normalizeFiberSnapshot, type FiberNode } from '../utils/normalizeFiberSnapshot';
import { diffSnapshots } from '../utils/diffSnapshots';

export interface ComponentTreeProps {
  snapshot: unknown;
  prevSnapshot: unknown;
}

/** Returns names of nodes whose state changed between prev and curr snapshots. */
function getChangedNames(prev: unknown, curr: unknown): Set<string> {
  const changed = new Set<string>();
  if (!prev || !curr) return changed;
  const diff = diffSnapshots(prev, curr);
  const hasChange = Object.values(diff).some((n) => n.type !== 'unchanged');
  // With flat snapshots a change anywhere marks the root node.
  // When Will's fiber tree lands, replace with per-node ID comparison.
  if (hasChange) changed.add('App');
  return changed;
}

// ── Tree node ────────────────────────────────────────────────────────

interface TreeNodeProps {
  node: FiberNode;
  path: string;
  depth: number;
  expandedPaths: Set<string>;
  onToggle: (path: string) => void;
  changedNames: Set<string>;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  path,
  depth,
  expandedPaths,
  onToggle,
  changedNames,
}) => {
  const isExpanded  = expandedPaths.has(path);
  const hasChildren = node.children.length > 0;
  const isChanged   = changedNames.has(node.name);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!hasChildren) return;
    if (e.key === 'ArrowRight' && !isExpanded) { e.preventDefault(); onToggle(path); }
    if (e.key === 'ArrowLeft'  && isExpanded)  { e.preventDefault(); onToggle(path); }
    if (e.key === 'Enter' || e.key === ' ')    { e.preventDefault(); onToggle(path); }
  };

  const indent = depth * 16;

  return (
    <div role="treeitem" aria-expanded={hasChildren ? isExpanded : undefined}>
      {/* Node header */}
      <div
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onClick={() => hasChildren && onToggle(path)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          paddingLeft: indent + 4,
          paddingTop: 4,
          paddingBottom: 4,
          cursor: hasChildren ? 'pointer' : 'default',
          borderRadius: 4,
          background: isChanged ? 'rgba(245,158,11,0.08)' : 'transparent',
          outline: 'none',  // handled by :focus-visible in global.scss
        }}
      >
        {/* Expand/collapse arrow */}
        <span
          aria-hidden="true"
          style={{
            display: 'inline-block',
            width: 12,
            fontSize: 10,
            color: '#64748b',
            transition: 'transform 200ms ease',
            transform: hasChildren && isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
            visibility: hasChildren ? 'visible' : 'hidden',
          }}
        >
          ▶
        </span>

        {/* Component name */}
        <span style={{ color: '#7dd3fc', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 500 }}>
          {node.name}
        </span>

        {/* Changed badge */}
        {isChanged && (
          <span style={{
            fontSize: 10,
            padding: '1px 5px',
            borderRadius: 3,
            background: 'rgba(245,158,11,0.2)',
            color: '#f59e0b',
            fontFamily: 'var(--font-sans)',
          }}>
            changed
          </span>
        )}
      </div>

      {/* State / props — shown when expanded or when no children */}
      {(isExpanded || !hasChildren) && (
        <div style={{ paddingLeft: indent + 28 }}>
          {node.state.length > 0 && (
            <div style={{ marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: '#64748b', fontFamily: 'var(--font-sans)' }}>state</span>
              <pre style={{
                margin: '2px 0 0',
                padding: '4px 8px',
                background: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: 4,
                fontSize: 12,
                color: '#e2e8f0',
                fontFamily: 'var(--font-mono)',
                overflowX: 'auto',
              }}>
                {JSON.stringify(node.state, null, 2)}
              </pre>
            </div>
          )}

          {node.props && Object.keys(node.props).length > 0 && (
            <div style={{ marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: '#64748b', fontFamily: 'var(--font-sans)' }}>props</span>
              <pre style={{
                margin: '2px 0 0',
                padding: '4px 8px',
                background: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: 4,
                fontSize: 12,
                color: '#e2e8f0',
                fontFamily: 'var(--font-mono)',
                overflowX: 'auto',
              }}>
                {JSON.stringify(node.props, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Children */}
      {isExpanded && hasChildren && (
        <div role="group">
          {node.children.map((child, i) => (
            <TreeNode
              key={`${path}/${child.name}-${i}`}
              node={child}
              path={`${path}/${child.name}-${i}`}
              depth={depth + 1}
              expandedPaths={expandedPaths}
              onToggle={onToggle}
              changedNames={changedNames}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ── ComponentTree ────────────────────────────────────────────────────

const ComponentTree: React.FC<ComponentTreeProps> = ({ snapshot, prevSnapshot }) => {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(['root-0']));

  const onToggle = (path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      next.has(path) ? next.delete(path) : next.add(path);
      return next;
    });
  };

  if (!snapshot) {
    return (
      <div style={{ color: '#94a3b8', fontFamily: 'var(--font-sans)', fontSize: 13, padding: '12px 0' }}>
        No snapshot selected.
      </div>
    );
  }

  const nodes = normalizeFiberSnapshot(snapshot);
  const changedNames = getChangedNames(prevSnapshot, snapshot);

  return (
    <div
      role="tree"
      aria-label="Component tree"
      style={{
        background: '#0f172a',
        border: '1px solid #334155',
        borderRadius: 6,
        padding: '8px 4px',
        overflow: 'auto',
        maxHeight: 300,
        fontSize: 13,
      }}
    >
      {nodes.map((node, i) => (
        <TreeNode
          key={`root-${i}`}
          node={node}
          path={`root-${i}`}
          depth={0}
          expandedPaths={expandedPaths}
          onToggle={onToggle}
          changedNames={changedNames}
        />
      ))}
    </div>
  );
};

export default ComponentTree;
