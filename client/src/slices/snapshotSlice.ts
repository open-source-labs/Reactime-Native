//Setup Redux w/ actions + reducers in one place and type action.payload
//'PayloadAction' is a type and must be imported using a type-only import when 'verbatimModuleSyntax' is enabled
import type { PayloadAction } from '@reduxjs/toolkit'; 
//separated createSlice from PayloadAction because of type distinction required for PayloadAction
import { createSlice } from '@reduxjs/toolkit'; 

// I think remove the "playing". And I'm not sure what the intervalID is

//define shape of state for this slice
export interface SnapshotState {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  snapshots: any[]; // should we type this more strictly?
  currentIndex: number;
  playing: boolean;
  intervalId: number | null;
}

const initialState: SnapshotState = {
  snapshots: [],
  currentIndex: 0,
  playing: false,
  intervalId: null,
};

const snapshotSlice = createSlice({
  name: 'snapshot',
  initialState,
  reducers: {
    
    // redux toolkit allows us to make these changes in a slice that seem like we're updating state that should be immutable
    // but underneath the hood, redux toolkit just makes a copy of the state and returns it to us
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    addSnapshot: (state, action: PayloadAction<any>) => { 
      state.snapshots.push(action.payload); //adds new snapshot to array in SnapshotState
      state.currentIndex = state.snapshots.length - 1; // updates currentIndex to most recent snapshot
    },
    jumpToSnapshot: (state, action: PayloadAction<number>) => {
      const newIndex = action.payload;
      if (newIndex >= 0 && newIndex < state.snapshots.length) { 
        state.currentIndex = newIndex;
      }
    },
    resetSnapshots: (state) => { //used when restarting debugging or reloading app
      state.snapshots = [];
      state.currentIndex = 0;
      state.playing = false;
      state.intervalId = null;
    },
    playSnapshots: (state, action: PayloadAction<number>) => {
      state.playing = true;
      state.intervalId = action.payload;
    },
    pauseSnapshots: (state) => {
      state.playing = false;
      state.intervalId = null;
    },
  },
});

//console.log('snapshotSlice loaded', snapshotSlice);
export const {
  addSnapshot,
  jumpToSnapshot,
  resetSnapshots,
  playSnapshots,
  pauseSnapshots,
} = snapshotSlice.actions;

export default snapshotSlice.reducer;
