import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import SnapshotView from './SnapshotView';

// SnapshotView is props-based (Decision 5): MainContainer owns the store
// connection and passes snapshot, index, and total down as props.
// Tests mirror the real call site in MainContainer.

const baseSnapshots = [{ ts: 1 }, { ts: 2 }, { ts: 3 }];

describe('SnapshotView (unit)', () => {
  test('renders title and summary line (Total | Index) from store values', () => {
    render(<SnapshotView snapshot={baseSnapshots[1]} index={1} total={3} />);

    expect(screen.getByText('Snapshot View')).toBeInTheDocument();
    // Anchored regex: prevents parent containers (whose textContent also
    // includes this substring) from causing a multiple-match error.
    expect(screen.getByText(/^Total:\s*3\s*\|\s*Index:\s*1$/i)).toBeInTheDocument();
  });

  test('pretty-prints the current snapshot as JSON (2-space indent)', () => {
    render(<SnapshotView snapshot={baseSnapshots[1]} index={1} total={3} />);

    // Current index = 1 -> { ts: 2 }
    // Function matcher scopes the query to the <pre> element only.
    const pre = screen.getByText((content, el) => {
      return el?.tagName.toLowerCase() === 'pre' && content.includes('"ts": 2');
    });
    expect(pre).toBeInTheDocument();
    expect(pre.textContent).toContain('\n  "ts": 2'); // evidence of 2-space indent
  });

  test('shows "No snapshot selected" when currentIndex is out of bounds (too high)', () => {
    render(<SnapshotView snapshot={null} index={99} total={3} />);
    expect(screen.getByText(/^No snapshot selected$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Total:\s*3\s*\|\s*Index:\s*99$/i)).toBeInTheDocument();
  });

  test('shows "No snapshot selected" when currentIndex is negative', () => {
    render(<SnapshotView snapshot={null} index={-1} total={3} />);
    expect(screen.getByText(/^No snapshot selected$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Total:\s*3\s*\|\s*Index:\s*-1$/i)).toBeInTheDocument();
  });

  test('handles empty snapshots: Total 0 | Index 0 and "No snapshot selected"', () => {
    render(<SnapshotView snapshot={null} index={0} total={0} />);

    expect(screen.getByText(/^Total:\s*0\s*\|\s*Index:\s*0$/i)).toBeInTheDocument();
    expect(screen.getByText(/^No snapshot selected$/i)).toBeInTheDocument();
  });

  test('updates displayed JSON when currentIndex changes and the component re-renders', () => {
    const { rerender } = render(<SnapshotView snapshot={baseSnapshots[1]} index={1} total={3} />);
    // First render (index 1): should show ts: 2
    expect(
      screen.getByText((content, el) => el?.tagName.toLowerCase() === 'pre' && content.includes('"ts": 2'))
    ).toBeInTheDocument();

    // Change snapshot prop and re-render (index 2): should show ts: 3
    rerender(<SnapshotView snapshot={baseSnapshots[2]} index={2} total={3} />);
    expect(
      screen.getByText((content, el) => el?.tagName.toLowerCase() === 'pre' && content.includes('"ts": 3'))
    ).toBeInTheDocument();
  });
});
