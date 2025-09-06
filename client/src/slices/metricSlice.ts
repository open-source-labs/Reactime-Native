import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type CommitMetric = {
    ts: number; //timestamp in ms from RN device
    durationMs: number; //duration in ms of commit
    fibersUpdated?: number; //optinal number of fibers updated during commit
    appId?: string; //optional appId if multiple RN apps are being profiled
};

export type LagMetric = {
    ts: number; //timestamp in ms from RN device
    lagMs: number; //lag in ms aka event loop stall measured on RN device - will's Q: how would RN app provide duration and lag in ms?
    appId?: string; //optional appId if multiple RN apps are being profiled
};

export type FirstRenderMetric = {
    ts: number,
    firstRenderMs: number; //time in ms for first screen render
    appId?: string; //optional appId if multiple RN apps are being profiled
}

interface MetricState { //shape of state for metrics in slice
    commits: CommitMetric[]; 
    lags: LagMetric[];  
    firstRenders: FirstRenderMetric[]; //

}

const initialState: MetricState = { //initial state for this slice
    commits: [],
    lags: [],
    firstRenders: [],
};

const metricSlice = createSlice({ //create the reducer slice
    name: 'metric', //name of slice
    initialState, //initial state
    reducers: { //pure functions to update state
        pushCommitMetric: (state, action: PayloadAction<CommitMetric>) => {
            state.commits.push(action.payload);
        },
        pushLagMetric: (state, action: PayloadAction<LagMetric>) => {
            state.lags.push(action.payload);
        },
        pushFirstRenderMetric: (state, action: PayloadAction<FirstRenderMetric>) => { // sent only once per app launch
            state.firstRenders.push(action.payload);
        },
        clearMetrics: (state) => {
            state.commits = [];
            state.lags = [];
        },
    },
});

export const { pushCommitMetric, pushLagMetric, pushFirstRenderMetric, clearMetrics  } = metricSlice.actions; // 

export default metricSlice.reducer; //export reducer to include in store 

