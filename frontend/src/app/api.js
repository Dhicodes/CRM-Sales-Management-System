import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Single RTK Query API slice. Each feature (leads, customers, deals, etc.)
// injects its own endpoints into this base via .injectEndpoints() in later phases.
export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl,
    credentials: 'include',
  }),
  tagTypes: [
    'Auth',
    'Users',
    'Leads',
    'Customers',
    'Deals',
    'Activities',
    'Notifications',
    'Dashboard',
  ],
  endpoints: (builder) => ({
    // Infrastructure sanity check only — resource endpoints are injected
    // by each feature slice in later phases.
    getHealth: builder.query({
      query: () => '/health',
    }),
  }),
});

export const { useGetHealthQuery } = api;
