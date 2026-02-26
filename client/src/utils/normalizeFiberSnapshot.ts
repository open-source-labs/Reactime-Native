/**
 * normalizeFiberSnapshot — adapter layer between raw snapshot payloads
 * and the FiberNode type consumed by ComponentTree.
 *
 * THIS IS THE ONLY FILE that needs updating when Will's fiber tree
 * serialization lands. ComponentTree and its tests are decoupled from
 * the raw snapshot shape.
 *
 * Handles three shapes today:
 *   1. Future fiber tree  — { name: string, children: FiberNode[], state, props }
 *   2. Debug panel shape  — { component: string, state: {}, props: {} }
 *   3. Flat state shape   — { count: 5, letter: 'b', timestamp: '...' }
 */

export interface FiberNode {
  /** Display name of the React component. */
  name: string;
  /** Serialized hook/state values for this node. */
  state: unknown[];
  /** Props for this node (optional). */
  props?: Record<string, unknown>;
  /** Child component nodes. */
  children: FiberNode[];
}

function isFiberNode(val: unknown): val is FiberNode {
  if (!val || typeof val !== 'object') return false;
  const v = val as Record<string, unknown>;
  return typeof v.name === 'string' && Array.isArray(v.children);
}

function stateFromObject(obj: unknown): unknown[] {
  if (!obj || typeof obj !== 'object') return [];
  return Object.entries(obj as Record<string, unknown>)
    .map(([k, v]) => ({ [k]: v }));
}

export function normalizeFiberSnapshot(snapshot: unknown): FiberNode[] {
  if (!snapshot || typeof snapshot !== 'object') {
    return [{ name: 'Snapshot', state: [], children: [] }];
  }

  const s = snapshot as Record<string, unknown>;

  // Shape 1 — future fiber tree (Will's serialized output)
  if (isFiberNode(s)) {
    return [s as FiberNode];
  }

  // Shape 2 — debug panel: { component, props, state }
  if (typeof s.component === 'string') {
    return [{
      name: s.component,
      state: stateFromObject(s.state),
      props: s.props as Record<string, unknown> | undefined,
      children: [],
    }];
  }

  // Shape 3 — flat state from RN app: { count, letter, timestamp }
  const stateEntries = Object.entries(s)
    .filter(([k]) => k !== 'timestamp')
    .map(([k, v]) => ({ [k]: v }));

  return [{
    name: 'App',
    state: stateEntries,
    children: [],
  }];
}
