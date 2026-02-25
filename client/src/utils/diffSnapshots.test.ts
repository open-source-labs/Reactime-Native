import { describe, test, expect } from 'vitest';
import { diffSnapshots } from './diffSnapshots';

describe('diffSnapshots', () => {
  // ── Required cases ────────────────────────────────────────────────

  test('simple key-value change', () => {
    const prev = { count: 1 };
    const curr = { count: 2 };
    const diff = diffSnapshots(prev, curr);

    expect(diff.count.type).toBe('changed');
    expect(diff.count.prevValue).toBe(1);
    expect(diff.count.nextValue).toBe(2);
  });

  test('nested object change', () => {
    const prev = { user: { name: 'Alice', age: 30 } };
    const curr = { user: { name: 'Alice', age: 31 } };
    const diff = diffSnapshots(prev, curr);

    expect(diff.user.type).toBe('changed');
    expect(diff.user.children).toBeDefined();
    expect(diff.user.children!.name.type).toBe('unchanged');
    expect(diff.user.children!.age.type).toBe('changed');
    expect(diff.user.children!.age.prevValue).toBe(30);
    expect(diff.user.children!.age.nextValue).toBe(31);
  });

  test('added key', () => {
    const prev = { count: 1 };
    const curr = { count: 1, letter: 'a' };
    const diff = diffSnapshots(prev, curr);

    expect(diff.letter.type).toBe('added');
    expect(diff.letter.nextValue).toBe('a');
    expect(diff.letter.prevValue).toBeUndefined();
  });

  test('removed key', () => {
    const prev = { count: 1, letter: 'a' };
    const curr = { count: 1 };
    const diff = diffSnapshots(prev, curr);

    expect(diff.letter.type).toBe('removed');
    expect(diff.letter.prevValue).toBe('a');
    expect(diff.letter.nextValue).toBeUndefined();
  });

  // ── Edge cases ────────────────────────────────────────────────────

  test('identical snapshots produce all unchanged nodes', () => {
    const snap = { count: 5, label: 'hello' };
    const diff = diffSnapshots(snap, snap);

    expect(diff.count.type).toBe('unchanged');
    expect(diff.label.type).toBe('unchanged');
  });

  test('empty prev produces all added nodes', () => {
    const diff = diffSnapshots({}, { count: 1 });
    expect(diff.count.type).toBe('added');
  });

  test('empty curr produces all removed nodes', () => {
    const diff = diffSnapshots({ count: 1 }, {});
    expect(diff.count.type).toBe('removed');
  });

  test('nested object unchanged when values identical', () => {
    const snap = { user: { name: 'Alice' } };
    const diff = diffSnapshots(snap, snap);

    expect(diff.user.type).toBe('unchanged');
    expect(diff.user.children!.name.type).toBe('unchanged');
  });

  test('non-object prev treated as empty object', () => {
    const diff = diffSnapshots(null, { count: 1 });
    expect(diff.count.type).toBe('added');
  });
});
