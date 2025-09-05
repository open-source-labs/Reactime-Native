import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
//import { addSnapshot } from '../slices/snapshotSlice';
//import deepClone from '../utils/deepClone'; // optional, if needed

const useSnapshotRecorder = (fiberTree: any): void => {
  const dispatch = useDispatch();

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
