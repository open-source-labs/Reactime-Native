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

//*************SECOND ATTEMPT****** */
/*
import React from 'react';
import Slider, { type SliderProps } from 'rc-slider';
import Tooltip from 'rc-tooltip';
import 'rc-slider/assets/index.css';
import 'rc-tooltip/assets/bootstrap.css';

import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { jumpToSnapshot, pauseSnapshots } from '../slices/snapshotSlice';

// Minimal type for props passed to a custom handle
type CustomHandleProps = {
  value?: number;
  dragging?: boolean;
  index?: number;
  [key: string]: unknown;
};

// Get the internal Handle component in a type-safe way
const SliderWithHandle = Slider as unknown as { Handle: React.FC<CustomHandleProps> };
const { Handle } = SliderWithHandle;
console.log ("Handle component:", Handle); //not logging

// Custom handle with tooltip showing the index
const tooltipHandle: SliderProps['handleRender'] = (props) => { //should i use 'handle' or 'handleRender'?
  const { value, dragging, index, ...rest } = props as unknown as CustomHandleProps;
  return (
    <Tooltip
      prefixCls="rc-slider-tooltip"
      overlay={value}
      visible={!!dragging}
      placement="top"
      key={index}
    >
      <Handle value={value} {...rest} />
    </Tooltip>
  );
};

const TimelineSlider: React.FC = () => {
  console.log("We're in timeline slider module.") //logging
  const dispatch = useDispatch();

  const snapshotsLength = useSelector(
    (s: RootState) => s.snapshot.snapshots.length
  );
  const currentIndex = useSelector(
    (s: RootState) => s.snapshot.currentIndex
  );
 console.log ("Snapshots length:", snapshotsLength, "Current index:", currentIndex);
  if (snapshotsLength <= 0) return null;

  const handleSliderChange: SliderProps['onChange'] = (value) => {
    console.log("Slider changed to:", value, 'were in handleSliderChange'); //not logging
    const nextIndex = Array.isArray(value) ? value[0] : value;
    const safeIndex = Math.min(Math.max(0, nextIndex), Math.max(0, snapshotsLength - 1));
    // OR const safeIndex = Math.max(0, nextIndex);
    dispatch(jumpToSnapshot(safeIndex));
    dispatch(pauseSnapshots());
  };

  return (
    // adding max width to prevent stretching on wide screens and center slider
    <div style={{ padding: '8px 0' , maxWidth: 640}}> 
      <p>Hello</p>
      <Slider
        min={0}
        max={Math.max(0, snapshotsLength - 1)}
        value={currentIndex}
        onChange={handleSliderChange}
        handleRender={tooltipHandle}
        // vertical
        // reverse
        // style={{ height: '100%' }}
      />
    </div>
  );
};

export default TimelineSlider;
*/

//*************FIRST ATTEMPT****** */
// // client/src/components/TimelineSlider.tsx
// import React from 'react';
// import Slider from 'rc-slider';
// import Tooltip from 'rc-tooltip';
// import 'rc-slider/assets/index.css';
// import 'rc-tooltip/assets/bootstrap.css';

// import { useDispatch, useSelector } from 'react-redux';
// import type{ RootState } from '../store/store';
// import { jumpToSnapshot, pauseSnapshots } from '../slices/snapshotSlice';

// //minimal typing to satisfy TS when rendering handle
// type HandleProps = {
//   value?: number;
//   dragging?: boolean;
//   index?: number;
//   [key: string]: unknown;
// };

// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// const { Handle } = Slider as unknown as { Handle: React.FC<any> };

// // Custom handle with tooltip showing the current index while dragging
// const handle = (props: HandleProps) => {
//   const { value, dragging, index, ...rest } = props;
//   return (
//     <Tooltip
//       prefixCls="rc-slider-tooltip"
//       overlay={value}
//       visible={!!dragging}
//       placement="top"
//       key={index}
//     >
//       <Handle value={value} {...rest} />
//     </Tooltip>
//   );
// };

// const TimelineSlider: React.FC = () => {
//   const dispatch = useDispatch();

//   const snapshotsLength = useSelector(
//     (s: RootState) => s.snapshot.snapshots.length
//   );
//   const currentIndex = useSelector(
//     (s: RootState) => s.snapshot.currentIndex
//   );

//   if (snapshotsLength <= 0) return null;

//   // Type-safe handler for rc-slider (single or range value)
//   const handleSliderChange = (value: number | number[]) => {
//     const index = Array.isArray(value) ? value[0] : value;   // type guard
//     const newIndex = index < 0 ? 0 : index;
//     dispatch(jumpToSnapshot(newIndex));
//     dispatch(pauseSnapshots());
//   };

//   return (
//     <div style={{ padding: '8px 0' }}>
//       <Slider
//         // If you want a vertical slider like v26, uncomment these:
//         // vertical
//         // reverse
//         // style={{ height: '100%' }}

//         min={0}
//         max={Math.max(0, snapshotsLength - 1)}
//         value={currentIndex}
//         onChange={handleSliderChange}
//         handle={tooltipHandle}
//       />
//     </div>
//   );
// };

// export default TimelineSlider;
