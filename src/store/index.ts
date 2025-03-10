import { configureStore } from '@reduxjs/toolkit';
import profileReducer from './profile/profile.reducer.ts';

const store = configureStore({
    reducer: {
        profile: profileReducer,
        // other reducers
    },
    // Redux Toolkit includes thunk middleware by default, so you don't need to add it separately
});

export default store;