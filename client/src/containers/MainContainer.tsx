// src/containers/MainContainer.tsx
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { wsSend } from '../transport/socket';
import SnapshotView from '../components/SnapshotView';
import TimelineSlider from '../components/TimelineSlider';
import MetricsPanel from '../components/MetricsPanel';

// Inline debug component (can move to separate file later)
const ConnectionDebugger: React.FC = () => {
  const dispatch = useDispatch();
  const { snapshots, currentIndex } = useSelector((s: RootState) => s.snapshot);
  const { commits, lags, firstRenders } = useSelector((s: RootState) => s.metric);

  const sendTestSnapshot = () => {
    const testSnapshot = {
      channel: 'snapshot',
      type: 'add',
      payload: {
        id: `manual-test-${Date.now()}`,
        timestamp: Date.now(),
        component: 'TestComponent',
        props: { name: 'Manual Test' },
        state: { count: Math.floor(Math.random() * 100) }
      }
    };
    
    console.log('📤 Sending test snapshot:', testSnapshot);
    dispatch(wsSend(testSnapshot));
  };

  const sendTestMetric = () => {
    const testMetric = {
      channel: 'metrics',
      type: 'commit',
      payload: {
        ts: Date.now(),
        durationMs: Math.random() * 50 + 10,
        fibersUpdated: Math.floor(Math.random() * 10) + 1,
        appId: 'debug-test'
      }
    };
    
    console.log('📊 Sending test metric:', testMetric);
    dispatch(wsSend(testMetric));
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: 10, 
      right: 10, 
      background: '#1e293b', 
      border: '1px solid #334155',
      borderRadius: 8,
      padding: 8,
      fontSize: 10,
      zIndex: 1000,
      maxWidth: 200
    }}>
      <h4 style={{ margin: '0 0 8px 0', color: '#f1f5f9' }}>🔧 Debug Panel</h4>
      
      <div style={{ marginBottom: 8, color: '#94a3b8' }}>
        📦 Snapshots: {snapshots.length}<br/>
        📍 Current: {currentIndex}<br/>
        📊 Commits: {commits.length}<br/>
        📈 Lags: {lags.length}<br/>
        🎯 First Renders: {firstRenders.length}
      </div>
      
      <button 
        onClick={sendTestSnapshot}
        style={{ 
          display: 'block', 
          width: '100%', 
          marginBottom: 4, 
          padding: 4,
          fontSize: 10,
          background: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: 4,
          cursor: 'pointer'
        }}
      >
        📤 Send Test Snapshot
      </button>
      
      <button 
        onClick={sendTestMetric}
        style={{ 
          display: 'block', 
          width: '100%', 
          padding: 4,
          fontSize: 10,
          background: '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: 4,
          cursor: 'pointer'
        }}
      >
        📊 Send Test Metric
      </button>
    </div>
  );
};

const MainContainer: React.FC = () => {
  // Read once from Redux
  const { snapshots, currentIndex } = useSelector((s: RootState) => s.snapshot);

  // Derive current snapshot (guard against empty arrays)
  const current = snapshots[currentIndex] ?? null;

  console.log('📦 snapshots:', snapshots);
  console.log('📍 currentIndex:', currentIndex);
  console.log('📸 current:', current);

  return (
    <>
      {/* Debug panel - remove this later when everything works */}
      <ConnectionDebugger />
      
      {/* Main layout - this is your original working layout */}
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
    </>
  );
};

export default MainContainer;
/* ________________________________________________________________ */
// Original version below before edits to useFiberTree.ts and useSnapshotRecorder.ts
// // src/containers/MainContainer.tsx
// import React from 'react';
// import { useSelector } from 'react-redux';
// import type { RootState } from '../store/store';
// import SnapshotView from '../components/SnapshotView';
// import TimelineSlider from '../components/TimelineSlider';
// import MetricsPanel from '../components/MetricsPanel';

// const MainContainer: React.FC = () => {
//   //Read once from Redux
//   const { snapshots, currentIndex } = useSelector((s: RootState) => s.snapshot);

//   //Derive current snapshot (guard against empty arrays)
//   const current = snapshots[currentIndex] ?? null;

//   console.log('📦 snapshots:', snapshots);
// console.log('📍 currentIndex:', currentIndex);
// console.log('📸 current:', current);

//   return (
//     <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16, height: '100vh' }}>
//       <aside style={{ padding: 12, borderRight: '1px solid #eee' }}>
//         <h3 style={{ margin: '8px 0 12px' }}>Timeline</h3>
//         <TimelineSlider />
//       </aside>

//       <main style={{ display: 'grid', gridTemplateRows: '1fr auto', gap: 16 }}>
//         <section style={{ padding: 12, overflow: 'auto', borderBottom: '1px solid #eee' }}>
//           <h3 style={{ margin: '8px 0 12px' }}>Snapshot View</h3>

//           {/* Pass plain props to presentational component */}
//           <SnapshotView
//             snapshot={current}
//             index={currentIndex}
//             total={snapshots.length}
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

// export default MainContainer;

/* ________________________________________________________________ */
// Revised version below after edits to useFiberTree.ts and useSnapshotRecorder.ts

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
