import { configureStore } from '@reduxjs/toolkit';
import snapshotReducer from '../slices/snapshotSlice';
import metricReducer from '../slices/metricSlice';
import { wsListener } from '../transport/socket';

export const store = configureStore({
  reducer: {
    snapshot: snapshotReducer,
    metric: metricReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).prepend(wsListener.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
