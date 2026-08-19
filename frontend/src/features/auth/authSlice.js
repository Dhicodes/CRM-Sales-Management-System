import { createSlice } from '@reduxjs/toolkit';
import { authApi } from './authApi';

// status: 'idle' (not checked yet) | 'loading' (checking session)
//       | 'authenticated' | 'unauthenticated'
const initialState = {
  user: null,
  status: 'idle',
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addMatcher(authApi.endpoints.getMe.matchPending, (state) => {
        state.status = 'loading';
      })
      .addMatcher(authApi.endpoints.login.matchFulfilled, (state, action) => {
        state.user = action.payload.data;
        state.status = 'authenticated';
      })
      .addMatcher(authApi.endpoints.getMe.matchFulfilled, (state, action) => {
        state.user = action.payload.data;
        state.status = 'authenticated';
      })
      .addMatcher(authApi.endpoints.getMe.matchRejected, (state, action) => {
        // A client-side abort/skip (e.g. from resetApiState() re-triggering
        // this query on login/logout) is not an auth failure ignoring it
        // here avoids a false "logged out" flash that fights the real
        // fulfilled result landing right after it.
        if (action.meta.aborted || action.meta.condition) return;
        state.user = null;
        state.status = 'unauthenticated';
      })
      .addMatcher(authApi.endpoints.logout.matchFulfilled, (state) => {
        state.user = null;
        state.status = 'unauthenticated';
      });
  },
});

export default authSlice.reducer;

export const selectCurrentUser = (state) => state.auth.user;
export const selectAuthStatus = (state) => state.auth.status;
