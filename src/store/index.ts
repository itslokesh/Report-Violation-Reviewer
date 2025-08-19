import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

import authReducer from './slices/authSlice';
import reportsReducer from './slices/reportsSlice';
import challansReducer from './slices/challansSlice';
import dashboardReducer from './slices/dashboardSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    reports: reportsReducer,
    challans: challansReducer,
    dashboard: dashboardReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        // Ignore these field paths in all actions
        ignoredActionPaths: [
          'meta.arg', 
          'payload.timestamp', 
          'payload.createdAt', 
          'payload.updatedAt', 
          'payload.lastLoginAt', 
          'payload.expiresAt',
          'payload.user.createdAt',
          'payload.user.updatedAt',
          'payload.user.lastLoginAt'
        ],
        // Ignore these paths in the state
        ignoredPaths: [
          'reports.entities', 
          'challans.entities', 
          'auth.user.createdAt', 
          'auth.user.updatedAt', 
          'auth.user.lastLoginAt',
          'dashboard.stats'
        ],
      },
    }),
  devTools: import.meta.env.MODE !== 'production',
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
