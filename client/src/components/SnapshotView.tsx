// used to render UI and works in tandem with MainContainer (where logic, state, and context are managed)

import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
// 'RootState' is a type and must be imported using a type-only import when 'verbatimModuleSyntax' is enabled.
import type { RootState } from '../store/store';
import { jumpToSnapshot } from '../slices/snapshotSlice';

const SnapshotView = (): React.JSX.Element => {
  const snapshots = useSelector((state: RootState) => state.snapshot.snapshots);
  const currentIndex = useSelector((state: RootState) => state.snapshot.currentIndex);
  const dispatch = useDispatch();

  // Pseudocode:
  // loop through snapshots and render buttons/timeline
  // highlight current index
  // allow user to jump to snapshot

  return (
    <div>
      <h2>Snapshot Timeline</h2>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {snapshots.map((snap, index) => (
          <button
            key={index}
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
