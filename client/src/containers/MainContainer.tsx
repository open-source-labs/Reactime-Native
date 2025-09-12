import React, { useEffect } from 'react';
import SnapshotView from '../components/SnapshotView';
import TimelineSlider from '../components/TimelineSlider'

const MainContainer = (): React.JSX.Element => {
  // const dispatch = useDispatch();
  // //const [fiberTree, setFiberTree] = useState<{ state: string } | null>(null); // can also use the following for more shape fleixbility: const [fiberTree, setFiberTree] = useState<any>(null);

  // // 1. Connect to WebSocket here (future)
  // // 2. Update fiberTree when new data comes in
  // // 3. Use useSnapshotRecorder hook to dispatch snapshot to store


  //useSnapshotRecorder(fiberTree);

  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ marginTop: 0 }}>Reactime Native</h1>
      <TimelineSlider />
      <SnapshotView />
    </div>
  );
};

export default MainContainer;
