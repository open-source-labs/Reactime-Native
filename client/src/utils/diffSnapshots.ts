/**
 * diffSnapshots — pure utility for computing a deep diff between two snapshots.
 * Extracted for independent testability (shift-left).
 *
 * DiffType meanings:
 *   'added'     — key exists in curr but not in prev
 *   'removed'   — key exists in prev but not in curr
 *   'changed'   — key exists in both; value differs
 *   'unchanged' — key exists in both; value is identical
 */

export type DiffType = 'added' | 'removed' | 'changed' | 'unchanged';

export interface DiffNode {
  type: DiffType;
  prevValue?: unknown;
  nextValue?: unknown;
  /** Present when both prev and next are plain objects — recursive diff of children. */
  children?: Record<string, DiffNode>;
}

function isPlainObject(val: unknown): val is Record<string, unknown> {
  return val !== null && typeof val === 'object' && !Array.isArray(val);
}

/**
 * Recursively diffs two values at the object level.
 * Arrays are treated as atomic values and compared via JSON.stringify.
 */
export function diffSnapshots(
  prev: unknown,
  curr: unknown
): Record<string, DiffNode> {
  const result: Record<string, DiffNode> = {};

  const prevObj = isPlainObject(prev) ? prev : {};
  const currObj = isPlainObject(curr) ? curr : {};

  const allKeys = new Set([...Object.keys(prevObj), ...Object.keys(currObj)]);

  for (const key of allKeys) {
    const hasPrev = key in prevObj;
    const hasCurr = key in currObj;
    const prevVal = prevObj[key];
    const currVal = currObj[key];

    if (!hasPrev) {
      result[key] = { type: 'added', nextValue: currVal };
    } else if (!hasCurr) {
      result[key] = { type: 'removed', prevValue: prevVal };
    } else if (isPlainObject(prevVal) && isPlainObject(currVal)) {
      const children = diffSnapshots(prevVal, currVal);
      const hasChanges = Object.values(children).some((n) => n.type !== 'unchanged');
      result[key] = {
        type: hasChanges ? 'changed' : 'unchanged',
        prevValue: prevVal,
        nextValue: currVal,
        children,
      };
    } else if (JSON.stringify(prevVal) !== JSON.stringify(currVal)) {
      result[key] = { type: 'changed', prevValue: prevVal, nextValue: currVal };
    } else {
      result[key] = { type: 'unchanged', prevValue: prevVal, nextValue: currVal };
    }
  }

  return result;
}
