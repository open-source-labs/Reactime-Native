import React, { useState, useEffect } from 'react';
import SnapshotView from '../components/SnapshotView';
import useSnapshotRecorder from '../hooks/useSnapshotRecorder';
import TimelineSlider from '../components/TimelineSlider';

const MainContainer = ({ snapshotArray }): React.JSX.Element => {
  const [fiberTree, setFiberTree] = useState<{ state: string } | null>(null); // can also use the following for more shape fleixbility: const [fiberTree, setFiberTree] = useState<any>(null);

  // 1. Connect to WebSocket here (future)
  // 2. Update fiberTree when new data comes in
  // 3. Use useSnapshotRecorder hook to dispatch snapshot to store

  // Dummy test (remove later)
  useEffect(() => {
    const dummyFiberTree = { state: 'mockState' };
    setFiberTree(dummyFiberTree);
  }, []);

  useSnapshotRecorder(fiberTree);

  return (
    <div>
      <h1 style={{ marginLeft: '1rem', marginTop: '2rem' }}>Reactime Native</h1>
      <SnapshotView snapshotArray={snapshotArray}/>
      <TimelineSlider></TimelineSlider>
    </div>
  );
};

export default MainContainer;
