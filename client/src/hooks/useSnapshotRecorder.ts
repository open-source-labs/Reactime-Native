import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
//import { addSnapshot } from '../slices/snapshotSlice';
//import deepClone from '../utils/deepClone'; // optional, if needed

// Jam disabled below. 
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const useSnapshotRecorder = (fiberTree: any): void => { // could type more strictly if desired
  const dispatch = useDispatch();

console.log('Recording snapshot:', fiberTree);

  useEffect(() => {
    if (fiberTree) {
      // Pseudocode:
      // Whenever the fiberTree changes:
      // - deep clone it if necessary
      // - dispatch the new snapshot to Redux

      //dispatch(addSnapshot(deepClone(fiberTree)));
    }
  }, [fiberTree, dispatch]);
};

export default useSnapshotRecorder;
