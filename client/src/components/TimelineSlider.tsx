import React from 'react';

import Slider, { type SliderProps } from 'rc-slider'; //slider UI and its prop types
import Tooltip from 'rc-tooltip'; //Tooltip bubble for the thumb
import 'rc-slider/assets/index.css'; //required slider styles
import 'rc-tooltip/assets/bootstrap.css'; //required tooltip styles

import { useDispatch, useSelector } from 'react-redux'; //hooks to read/dispatch Redux state
import type { RootState } from '../store/store'; //app's root state type
import { jumpToSnapshot, pauseSnapshots } from '../slices/snapshotSlice'; //actions from snapshot slice

// functional react component for the slider
const TimelineSlider: React.FC = () => {
  const dispatch = useDispatch();

  //read values from redux store (slice key must be "snapshot" in store.ts)
  const snapshotsLength = useSelector((s: RootState) => s.snapshot.snapshots.length);
  const currentIndex = useSelector((s: RootState) => s.snapshot.currentIndex);

  //   console.log("We're in timeline slider module.");
  console.log('Snapshots length:', snapshotsLength, 'Current index:', currentIndex);

  // While debugging, keep rendering even if length is 0
  const safeMax = Math.max(0, snapshotsLength - 1); //if no snaps, max = 0
  const safeValue = Math.min(Math.max(0, currentIndex), safeMax);

  const handleSliderChange: SliderProps['onChange'] = (value) => {
    const next = Array.isArray(value) ? value[0] : value;
    const clamped = Math.min(Math.max(0, next), safeMax);
    dispatch(jumpToSnapshot(clamped)); //update redux to current index
    dispatch(pauseSnapshots()); //pause if user is scrubbing manually
  };

  return (
    <div style={{ padding: '8px 0', maxWidth: 640 }}>
      <Slider
        min={0}
        max={safeMax}
        value={safeValue}
        onChange={handleSliderChange}
        /** The supported way to add a tooltip around the thumb */
        handleRender={(node, props) => (
          <Tooltip
            prefixCls='rc-slider-tooltip'
            overlay={props.value as React.ReactNode}
            visible={!!props.dragging}
            placement='top'
          >
            {/* `node` is the real internal handle; do not spread `key` manually */}
            {node}
          </Tooltip>
        )}
        // For vertical like Reactime v26, uncomment:
        // vertical
        // reverse
        // style={{ height: '100%' }}
      />
    </div>
  );
};

export default TimelineSlider;

