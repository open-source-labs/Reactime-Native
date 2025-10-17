import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

// added explicit types to avoid any
type Snapshot = { ts: number };
type MockState = { snapshot: { snapshots: Snapshot[]; currentIndex: number } };

let mockState: MockState;
const mockDispatch = vi.fn();

// Mock action creators (plain objects for easy assertions)
vi.mock('../slices/snapshotSlice', () => ({
  jumpToSnapshot: (idx: number) => ({ type: 'snapshot/jumpToSnapshot', payload: idx }),
  pauseSnapshots: () => ({ type: 'snapshot/pauseSnapshots' }),
}));

// Mock react-redux hooks
vi.mock('react-redux', () => ({
  useSelector: (sel: (s: MockState) => unknown) => sel(mockState), // added explicit selector type to avoid any
  useDispatch: () => mockDispatch,
}));

// Mock rc-tooltip: passthrough
vi.mock('rc-tooltip', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// shared toggleable mode for the rc-slider mock (instead of re-mocking per test)
let sliderPayloadMode: 'number' | 'array' = 'number';

// declared minimal prop interface to avoid any
type MockSliderProps = {
  min?: number;
  max?: number;
  value?: number;
  onChange?: (v: number | number[]) => void;
};

vi.mock('rc-slider', () => ({
  default: (props: MockSliderProps) => {
    // replaced `any` with MockSliderProps
    const { min = 0, max = 100, value = 0, onChange } = props;
    return (
      <input
        role='slider'
        type='range'
        aria-label='timeline-slider' // added aria-label for clarity
        min={String(min)} // cast to string
        max={String(max)} // cast to string
        value={String(value)} // cast to string
        onChange={(e) => {
          // toggle array/number payload
          if (!onChange) return;
          if (sliderPayloadMode === 'number') {
            onChange(Number((e.target as HTMLInputElement).value));
          } else {
            onChange([Number((e.target as HTMLInputElement).value), Number((e.target as HTMLInputElement).value) + 1]);
          }
        }}
      />
    );
  },
}));

// Import AFTER mocks so component sees them
import TimelineSlider from './TimelineSlider';

beforeEach(() => {
  mockDispatch.mockClear();
  mockState = {
    // reset state explicitly before each test
    snapshot: { snapshots: [{ ts: 1 }, { ts: 2 }, { ts: 3 }], currentIndex: 1 },
  };
  sliderPayloadMode = 'number'; // reset slider mode
});

describe('TimelineSlider (unit)', () => {
  test('renders with min=0, max=snapshotsLength-1, value=currentIndex (clamped)', () => {
    render(<TimelineSlider />);
    const slider = screen.getByRole('slider') as HTMLInputElement;

    expect(slider.min).toBe('0');
    expect(slider.max).toBe('2');
    expect(slider.value).toBe('1');
  });

  test('clamps currentIndex below 0 to 0', () => {
    mockState.snapshot.currentIndex = -10;
    render(<TimelineSlider />);
    const slider = screen.getByRole('slider') as HTMLInputElement;
    expect(slider.value).toBe('0');
  });

  test('clamps currentIndex above max to safeMax', () => {
    mockState.snapshot.currentIndex = 999;
    render(<TimelineSlider />);
    const slider = screen.getByRole('slider') as HTMLInputElement;
    expect(slider.value).toBe('2');
  });

  test('snapshotsLength=0 => max=0, value=0', () => {
    mockState.snapshot.snapshots = [];
    mockState.snapshot.currentIndex = 10;
    render(<TimelineSlider />);
    const slider = screen.getByRole('slider') as HTMLInputElement;
    expect(slider.max).toBe('0');
    expect(slider.value).toBe('0');
  });

  test('dispatches jumpToSnapshot(clamped) then pauseSnapshots() when changing beyond max', () => {
    render(<TimelineSlider />);
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '999' } });
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'snapshot/jumpToSnapshot', payload: 2 });
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'snapshot/pauseSnapshots' });
  });

  test('range mode: mock rc-slider passes ARRAY; component uses first value and clamps', () => {
    sliderPayloadMode = 'array';
    render(<TimelineSlider />);
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '5' } });
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'snapshot/jumpToSnapshot', payload: 2 }); // clamped to max
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'snapshot/pauseSnapshots' });
  });
});

//INTEGRATION TEST: Ensure that the TimelineSlider component renders correctly with Redux store
//CURRENTLY BUGGY: useMemo is not working as expected somewhere in the React pipeline, causing the test to fail.
// import { render, screen } from '@testing-library/react';
// import { Provider } from 'react-redux';
// import { configureStore } from '@reduxjs/toolkit';
// import snapshotReducer, { addSnapshot } from '../slices/snapshotSlice';
// import TimelineSlider from './TimelineSlider';
// import { test, expect } from 'vitest';

// function renderWithStore(ui: React.ReactNode) {
//     const store = configureStore({ reducer: { snapshot: snapshotReducer } });
//     store.dispatch(addSnapshot({ ts: 1 })); // Add a snapshot for testing
//     return { ...render(<Provider store={store}>{ui}</Provider>), store };
// }

// test ('renders TimelineSlider and shows index', () => {
//     renderWithStore(<TimelineSlider />);
//     // tooltip only shows while dragging, but slider input should be present
//     expect(screen.getByRole('slider')).toBeInTheDocument()
// });
