import { api } from '../../app/api';

export const dashboardApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardSummary: builder.query({
      query: () => '/dashboard/summary',
      providesTags: [{ type: 'Dashboard', id: 'SUMMARY' }],
    }),
    getTeamPerformance: builder.query({
      query: () => '/dashboard/team-performance',
      providesTags: [{ type: 'Dashboard', id: 'TEAM' }],
    }),
  }),
});

export const { useGetDashboardSummaryQuery, useGetTeamPerformanceQuery } = dashboardApi;
