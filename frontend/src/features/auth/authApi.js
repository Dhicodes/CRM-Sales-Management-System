import { api } from '../../app/api';

// login/logout swap which user's data the whole app should be showing, so
// every cached query (leads, customers, deals, assignable users, ...) must
// be thrown away and refetched fresh otherwise RTK Query keeps serving the
// previous user's cached results (keyed by endpoint+args, not by session)
// until a hard page reload forces a refetch.
async function resetCacheAfterAuthChange(arg, { dispatch, queryFulfilled }) {
  try {
    await queryFulfilled;
    dispatch(api.util.resetApiState());
  } catch {
    // request failed (e.g. wrong password) — nothing to reset
  }
}

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['Auth'],
      onQueryStarted: resetCacheAfterAuthChange,
    }),
    logout: builder.mutation({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
      invalidatesTags: ['Auth'],
      onQueryStarted: resetCacheAfterAuthChange,
    }),
    getMe: builder.query({
      query: () => '/auth/me',
      providesTags: ['Auth'],
    }),
  }),
});

export const { useLoginMutation, useLogoutMutation, useGetMeQuery } = authApi;
