import React from 'react';

import Slider, { type SliderProps } from 'rc-slider';
import Tooltip from 'rc-tooltip';
import 'rc-slider/assets/index.css';
import 'rc-tooltip/assets/bootstrap.css';

import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { jumpToSnapshot, pauseSnapshots } from '../slices/snapshotSlice';

const TimelineSlider: React.FC = () => {
  const dispatch = useDispatch();

  const snapshotsLength = useSelector((s: RootState) => s.snapshot.snapshots.length);
  const currentIndex = useSelector((s: RootState) => s.snapshot.currentIndex);

  console.log('Snapshots length:', snapshotsLength, 'Current index:', currentIndex);

  const safeMax = Math.max(0, snapshotsLength - 1);
  const safeValue = Math.min(Math.max(0, currentIndex), safeMax);

  const isEmpty = snapshotsLength === 0;

  const handleSliderChange: SliderProps['onChange'] = (value) => {
    const next = Array.isArray(value) ? value[0] : value;
    const clamped = Math.min(Math.max(0, next), safeMax);
    dispatch(jumpToSnapshot(clamped));
    dispatch(pauseSnapshots());
  };

  return (
    <div role="group" aria-label="Snapshot timeline" style={{ padding: '8px 0', maxWidth: 640 }}>
      <Slider
        min={0}
        max={safeMax}
        value={safeValue}
        onChange={handleSliderChange}
        disabled={isEmpty}
        aria-label='timeline slider'
        handleRender={(node, props) => (
          <Tooltip
            prefixCls='rc-slider-tooltip'
            overlay={props.value as React.ReactNode}
            visible={!!props.dragging}
            placement='top'
          >
            {node}
          </Tooltip>
        )}
      />
    </div>
  );
};

export default TimelineSlider;
