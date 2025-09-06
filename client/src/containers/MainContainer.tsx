// src/containers/MainContainer.tsx
import React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import SnapshotView from '../components/SnapshotView';
import TimelineSlider from '../components/TimelineSlider';
import MetricsPanel from '../components/MetricsPanel';

const MainContainer: React.FC = () => {
  //Read once from Redux
  const { snapshots, currentIndex } = useSelector((s: RootState) => s.snapshot);

  //Derive current snapshot (guard against empty arrays)
  const current = snapshots[currentIndex] ?? null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16, height: '100vh' }}>
      <aside style={{ padding: 12, borderRight: '1px solid #eee' }}>
        <h3 style={{ margin: '8px 0 12px' }}>Timeline</h3>
        <TimelineSlider />
      </aside>

      <main style={{ display: 'grid', gridTemplateRows: '1fr auto', gap: 16 }}>
        <section style={{ padding: 12, overflow: 'auto', borderBottom: '1px solid #eee' }}>
          <h3 style={{ margin: '8px 0 12px' }}>Snapshot View</h3>

          {/* Pass plain props to presentational component */}
          <SnapshotView
            snapshot={current}
            index={currentIndex}
            total={snapshots.length}
          />
        </section>

        <section style={{ padding: 12 }}>
          <h3 style={{ margin: '8px 0 12px' }}>Performance Metrics</h3>
          <MetricsPanel />
        </section>
      </main>
    </div>
  );
};

export default MainContainer;

// import React from 'react'; // not using { useEffect } because no side effects here 
// import { useSelector } from 'react-redux';
// import type { RootState } from '../store/store';
// // import { useDispatch } from 'react-redux';
// // import { useState } from 'react';
// // import { useSnapshotRecorder } from '../hooks/useSnapshotRecorder'; // custom hook to record snapshots when fiberTree changes
// // import { wsConnect } from '../transport/socket'; // action to initiate WebSocket connection
// import SnapshotView from '../components/SnapshotView';
// //import type { SnapshotViewProps } from '../components/SnapshotView';
// import TimelineSlider from '../components/TimelineSlider';
// import MetricsPanel from '../components/MetricsPanel';

// const MainContainer: React.FC = () => {
//   // Central reads (kept minimal here; heavy lifting stays inside components)
//   const currentIndex = useSelector((s: RootState) => s.snapshot.currentIndex);
//   const snapshots   = useSelector((s: RootState) => s.snapshot.snapshots);
//   const current = snapshots[currentIndex];
//   console.log(snapshots)

//   return (
//     <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16, height: '100vh' }}>
//       <aside style={{ padding: 12, borderRight: '1px solid #eee' }}>
//         <h3 style={{ margin: '8px 0 12px' }}>Timeline</h3>
//         <TimelineSlider />
//       </aside>

//       <main style={{ display: 'grid', gridTemplateRows: '1fr auto', gap: 16 }}>
//         <section style={{ padding: 12, overflow: 'auto', borderBottom: '1px solid #eee' }}>
//           <h3 style={{ margin: '8px 0 12px' }}>Snapshot View</h3>
//           <SnapshotView
//             // snapshot={snapshots[currentIndex]} // 
//             // index={currentIndex}
//             // total={snapshots.length}
//           />
//         </section>

//         <section style={{ padding: 12 }}>
//           <h3 style={{ margin: '8px 0 12px' }}>Performance Metrics</h3>
//           <MetricsPanel />
//         </section>
//       </main>
//     </div>
//   );
// };

// // const MainContainer = (): React.JSX.Element => {
// //   // const dispatch = useDispatch();
// //   // //const [fiberTree, setFiberTree] = useState<{ state: string } | null>(null); // can also use the following for more shape fleixbility: const [fiberTree, setFiberTree] = useState<any>(null);

// //   // // 1. Connect to WebSocket here (future)
// //   // // 2. Update fiberTree when new data comes in
// //   // // 3. Use useSnapshotRecorder hook to dispatch snapshot to store


// //   //useSnapshotRecorder(fiberTree);

// //   return (
// //     <div style={{ padding: 16 }}>
// //       <h1 style={{ marginTop: 0 }}>Reactime Native DevTool (MVP)</h1>
// //       <TimelineSlider />
// //       <SnapshotView />
// //     </div>
// //   );
// // };

// export default MainContainer;
