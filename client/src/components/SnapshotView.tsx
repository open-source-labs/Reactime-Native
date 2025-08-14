// used to render UI and works in tandem with MainContainer (where logic, state, and context are managed)

import React from 'react';
import { useSelector, } from 'react-redux'; //may not need useDispatch if not dispatching actions 
// 'RootState' is a type and must be imported using a type-only import when 'verbatimModuleSyntax' is enabled.
import type { RootState } from '../store/store';
//import { jumpToSnapshot } from '../slices/snapshotSlice'; //may not need this

const SnapshotView: React.FC = () => {
  const { snapshots, currentIndex } = useSelector((s: RootState) => s.snapshot);
  const current = snapshots[currentIndex];

  return (
    <div style={{ padding: 12, border: '1px solid #e5e5e5', marginTop: 12 }}>
      <h3 style={{ margin: 0 }}>Snapshot View</h3>
      <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>
        Total: {snapshots.length} | Index: {currentIndex}
      </div>
      <pre style={{ background: '#fafafa', padding: 10, overflow: 'auto', maxHeight: 260 }}>
        {current ? JSON.stringify(current, null, 2) : 'No snapshot selected'}
      </pre>
    </div>
  );
};

export default SnapshotView;

/*
1ST ATTEMPT:
const SnapshotView = (): React.JSX.Element => {
  const snapshots = useSelector((state: RootState) => state.snapshot.snapshots);
  const currentIndex = useSelector((state: RootState) => state.snapshot.currentIndex);
  const dispatch = useDispatch(); // will need to do useDispatch<AppDispatch>() if we use thunks (or a wrapper: useAppDispatch())

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

*/

