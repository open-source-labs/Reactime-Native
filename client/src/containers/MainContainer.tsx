import React from 'react';
import SnapshotView from '../components/SnapshotView';
import TimelineSlider from '../components/TimelineSlider'

const MainContainer = (): React.JSX.Element => {

  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ marginTop: 0 }}>Reactime Native DevTool (MVP)</h1>
      <TimelineSlider />
      <SnapshotView />
    </div>
  );
};

export default MainContainer;
