import { configureStore } from '@reduxjs/toolkit';

/**
 * Redux store kept for future cart/orders global state (Phases 3–4).
 * Auth/profile remain in AppwriteContext for Phase 1.
 */
export const store = configureStore({
  reducer: {
    // Placeholder so the store remains valid until domain slices are added.
    app: (state = {}) => state,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
