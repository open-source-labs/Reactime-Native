import { render, screen } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

// ---- Types to avoid `any`
type Snapshot = Record<string, unknown>;
type MockState = { snapshot: { snapshots: Snapshot[]; currentIndex: number } };

// ---- Shared mock state
let mockState: MockState;

// ---- Mock react-redux (unit scope: no real store)
vi.mock('react-redux', () => ({
  useSelector: (sel: (s: MockState) => unknown) => sel(mockState),
}));

// ---- Import AFTER mocks
import SnapshotView from './SnapshotView';

beforeEach(() => {
  mockState = {
    snapshot: {
      snapshots: [{ ts: 1 }, { ts: 2 }, { ts: 3 }],
      currentIndex: 1,
    },
  };
});

describe('SnapshotView (unit)', () => {
  test('renders title and summary line (Total | Index) from store values', () => {
    render(<SnapshotView />);

    expect(screen.getByText('Snapshot View')).toBeInTheDocument();
    expect(screen.getByText(/Total:\s*3\s*\|\s*Index:\s*1/i)).toBeInTheDocument();
  });

  test('pretty-prints the current snapshot as JSON (2-space indent)', () => {
    render(<SnapshotView />);

    // Current index = 1 -> { ts: 2 }
    // Check that JSON text for "ts": 2 appears and includes a newline/indent
    const pre = screen.getByText((content, el) => {
      return el?.tagName.toLowerCase() === 'pre' && content.includes('"ts": 2');
    });
    expect(pre).toBeInTheDocument();
    expect(pre.textContent).toContain('\n  "ts": 2'); // evidence of 2-space indent
  });

  test('shows "No snapshot selected" when currentIndex is out of bounds (too high)', () => {
    mockState.snapshot.currentIndex = 99; // out of range
    render(<SnapshotView />);
    expect(screen.getByText(/No snapshot selected/i)).toBeInTheDocument();
    expect(screen.getByText(/Total:\s*3\s*\|\s*Index:\s*99/i)).toBeInTheDocument(); // summary still reflects store
  });

  test('shows "No snapshot selected" when currentIndex is negative', () => {
    mockState.snapshot.currentIndex = -1; // negative index
    render(<SnapshotView />);
    expect(screen.getByText(/No snapshot selected/i)).toBeInTheDocument();
    expect(screen.getByText(/Total:\s*3\s*\|\s*Index:\s*-1/i)).toBeInTheDocument();
  });

  test('handles empty snapshots: Total 0 | Index 0 and "No snapshot selected"', () => {
    mockState.snapshot.snapshots = [];
    mockState.snapshot.currentIndex = 0;
    render(<SnapshotView />);

    expect(screen.getByText(/Total:\s*0\s*\|\s*Index:\s*0/i)).toBeInTheDocument();
    expect(screen.getByText(/No snapshot selected/i)).toBeInTheDocument();
  });

  test('updates displayed JSON when currentIndex changes and the component re-renders', () => {
    const { rerender } = render(<SnapshotView />);
    // First render (index 1): should show ts: 2
    expect(screen.getByText(/"ts": 2/)).toBeInTheDocument();

    // Change state and re-render
    mockState.snapshot.currentIndex = 2;
    rerender(<SnapshotView />);
    expect(screen.getByText(/"ts": 3/)).toBeInTheDocument();
  });
});
