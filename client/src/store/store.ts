import { configureStore } from '@reduxjs/toolkit';

//no need for reducers/main reducer b/c Redux Toolkit's createSlice handles that for us
import snapshotReducer from '../slices/snapshotSlice'; //should I add .reducer to the end?
import { wsListener } from '../transport/socket';

//import more slices here later?

export const store = configureStore({
  //export store
  reducer: {
    snapshot: snapshotReducer, //should this be snapshotSlice.reducer?
  },
  middleware: (
    getDefaultMiddleware //Redux Toolkit's default middleware to customize
  ) =>
    getDefaultMiddleware({
      serializableCheck: false, //prevent warnings & errors for complex non-serializable data like Fiber Tree and snapshots
    }).concat(wsListener.middleware),
});

export type RootState = ReturnType<typeof store.getState>; //export utility type to reflect Redux state tree

export type AppDispatch = typeof store.dispatch; //export AppDispatch type used in async thunks or custom hooks (may not need this) -> a thunk handles async logic within a Redux app

export const wsConnect = (url: string) => ({ type: 'ws/connect', payload: url } as const);
export const wsDisconnect = () => ({ type: 'ws/disconnect' } as const);
export const wsSend = (data: any) => ({ type: 'ws/send', payload: data } as const);
export type WSActions = ReturnType<typeof wsConnect> | ReturnType<typeof wsDisconnect> | ReturnType<typeof wsSend>;
