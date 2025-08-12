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

// Custom handle with tooltip showing the index
const tooltipHandle: SliderProps['handleRender'] = (props) => {
  const { value, dragging, index, ...rest } = props as unknown as CustomHandleProps;
  return (
    <Tooltip prefixCls='rc-slider-tooltip' overlay={value} visible={!!dragging} placement='top' key={index}>
      <Handle value={value} {...rest} />
    </Tooltip>
  );
};

const TimelineSlider: React.FC = () => {
  console.log('hello from timeline slider');
  const dispatch = useDispatch();

  const snapshotsLength = useSelector((s: RootState) => s.snapshot.snapshots.length);
  const currentIndex = useSelector((s: RootState) => s.snapshot.currentIndex);

  console.log('snapshot length:', snapshotsLength);
  console.log('current index', currentIndex);

  if (snapshotsLength <= 0) return null;
  console.log('hello do we get here')

  const handleSliderChange: SliderProps['onChange'] = (value) => {
    const nextIndex = Array.isArray(value) ? value[0] : value;
    const safeIndex = Math.max(0, nextIndex);
    dispatch(jumpToSnapshot(safeIndex));
    dispatch(pauseSnapshots());
  };

  return (
    <div style={{ padding: '8px 0' }}>
      <p>hi</p>
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
