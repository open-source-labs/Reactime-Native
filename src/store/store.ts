import { configureStore } from '@reduxjs/toolkit';
import snapshotReducer from '../slices/snapshotSlice'; //should I add .reducer to the end?

//import more slices here later?


export const store = configureStore ({ //export store
    reducer: {
        snapshot: snapshotReducer, //should this be snapshotSlice.reducer?
    },
    middleware: (getDefaultMiddleware) => //Redux Toolkit's default middleware to customize
        getDefaultMiddleware({
            serializableCheck: false, //prevent warnings & errors for complex non-serializable data like Fiber Tree and snapshots
        }),
});


export type RootState = ReturnType<typeof store.getState>; //export utility type to reflect Redux state tree

export type AppDispatch = typeof store.dispatch; //export AppDispatch type used in async thunks or custom hooks (may not need this) -> a thunk handles async logic within a Redux app

