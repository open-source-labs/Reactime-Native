import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { jumpToSnapshot, playSnapshots, pauseSnapshots } from '../slices/snapshotSlice';
import TimelineSlider from './TimelineSlider';
import { canStepBack, canStepForward, shouldAutoStop } from '../utils/timelineUtils';

const SPEEDS = [
  { label: '0.5x', ms: 2000 },
  { label: '1.0x', ms: 1000 },
  { label: '2.0x', ms: 500 },
] as const;

const TimelineControls: React.FC = () => {
  const dispatch = useDispatch();
  const { snapshots, currentIndex, playing } = useSelector((s: RootState) => s.snapshot);

  const [speedIdx, setSpeedIdx] = useState(1); // default 1.0x

  // Refs to latest values — prevents stale closures inside setInterval callback
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentIndexRef = useRef(currentIndex);
  const snapshotsLengthRef = useRef(snapshots.length);
  currentIndexRef.current = currentIndex;
  snapshotsLengthRef.current = snapshots.length;

  const isEmpty = snapshots.length === 0;

  // ── Playback interval ────────────────────────────────────────────
  useEffect(() => {
    if (!playing) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      const idx = currentIndexRef.current;
      const len = snapshotsLengthRef.current;
      if (shouldAutoStop(idx, len)) {
        dispatch(pauseSnapshots());
      } else {
        dispatch(jumpToSnapshot(idx + 1));
      }
    }, SPEEDS[speedIdx].ms);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [playing, speedIdx, dispatch]);

  // ── Handlers ─────────────────────────────────────────────────────
  const handlePlay = () => {
    if (isEmpty) return;
    if (playing) {
      dispatch(pauseSnapshots());
    } else {
      // Restart from beginning if already at the end
      if (!canStepForward(currentIndex, snapshots.length)) {
        dispatch(jumpToSnapshot(0));
      }
      dispatch(playSnapshots(0));
    }
  };

  const handleBack = () => {
    if (canStepBack(currentIndex)) dispatch(jumpToSnapshot(currentIndex - 1));
  };

  const handleForward = () => {
    if (canStepForward(currentIndex, snapshots.length)) dispatch(jumpToSnapshot(currentIndex + 1));
  };

  // ── Styles ───────────────────────────────────────────────────────
  const btn = (disabled: boolean): React.CSSProperties => ({
    background: 'transparent',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    color: disabled ? '#4b5563' : '#f1f5f9',
    cursor: disabled ? 'default' : 'pointer',
    fontFamily: 'var(--font-sans)',
    fontSize: 15,
    lineHeight: 1,
    minWidth: 32,
    padding: '5px 10px',
    transition: 'color var(--transition)',
  });

  const selectStyle: React.CSSProperties = {
    background: '#0f172a',
    border: '1px solid #4b5563',
    borderRadius: 'var(--radius-md)',
    color: '#f1f5f9',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    fontSize: 13,
    padding: '5px 8px',
  };

  return (
    <div
      role="group"
      aria-label="Playback controls"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: '10px 15px 20px',
        background: '#1e293b',
        borderTop: '1px solid #334155',
        flexShrink: 0,
      }}
    >
      {/* Play / Pause — left of slider; aria-label toggles with state (WCAG 4.1.2) */}
      <button
        onClick={handlePlay}
        aria-disabled={isEmpty}
        aria-label={playing ? 'Pause' : 'Play'}
        style={btn(isEmpty)}
      >
        {playing ? '⏸' : '▶'}
      </button>

      {/* Slider — fills remaining space; ARIA handled inside TimelineSlider */}
      <div style={{ flex: 1 }}>
        <TimelineSlider />
      </div>

      {/* Back / Forward / Speed — right of slider, uniform gap ensures equidistance */}
      <button
        onClick={handleBack}
        aria-disabled={isEmpty || !canStepBack(currentIndex)}
        aria-label="Previous snapshot"
        style={btn(isEmpty || !canStepBack(currentIndex))}
      >
        ⏪
      </button>

      <button
        onClick={handleForward}
        aria-disabled={isEmpty || !canStepForward(currentIndex, snapshots.length)}
        aria-label="Next snapshot"
        style={btn(isEmpty || !canStepForward(currentIndex, snapshots.length))}
      >
        ⏩
      </button>

      {/* Speed — WCAG 4.1.2: aria-label on select */}
      <select
        value={speedIdx}
        onChange={(e) => setSpeedIdx(Number(e.target.value))}
        aria-label="Playback speed"
        style={selectStyle}
      >
        {SPEEDS.map((s, i) => (
          <option key={s.label} value={i}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default TimelineControls;
