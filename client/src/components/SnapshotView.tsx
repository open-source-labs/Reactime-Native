// used to render UI and works in tandem with MainContainer (where logic, state, and context are managed)

import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
// 'RootState' is a type and must be imported using a type-only import when 'verbatimModuleSyntax' is enabled.
import type { RootState } from '../store/store';
import { jumpToSnapshot } from '../slices/snapshotSlice';
import ToolTipDataDisplay from './ToolTipDataDisplay';

const SnapshotView = ({ snapshotArray }): React.JSX.Element => {
  const snapshots = useSelector((state: RootState) => state.snapshot.snapshots);
  const currentIndex = useSelector((state: RootState) => state.snapshot.currentIndex);
  const dispatch = useDispatch(); // will need to do useDispatch<AppDispatch>() if we use thunks (or a wrapper: useAppDispatch())

  // Pseudocode:
  // loop through snapshots and render buttons/timeline
  // highlight current index
  // allow user to jump to snapshot

  return (
    <div>
      <h2 style={{ marginLeft: '3rem' }}>Snapshot Timeline</h2>
      {/* <ul>
        {snapshotArray.map((msgSnap, index) => (
          <li key={index}>
            {JSON.stringify(msgSnap, null, 2)}
          </li>
        ))}
      </ul> */}
      <ol>
        {snapshotArray.map((msgSnap, index) => (
          <li key={index}>
            <ToolTipDataDisplay data={JSON.stringify(msgSnap, null, 2)} />
          </li>
        ))}
      </ol>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {snapshots.map((snap, index) => (
          <button
            key={index}
             /* maybe we need some way of getting the proper index when jumping to the snapshot? 
             Or else how do we know what snapshot to jump to on just an onClick()? */
            onClick={() => dispatch(jumpToSnapshot(index))}
            style={{
              backgroundColor: index === currentIndex ? 'skyblue' : 'lightgray',
              padding: '5px',
            }}
          >
            {index}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SnapshotView;
