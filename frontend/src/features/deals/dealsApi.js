import { api } from '../../app/api';

function buildQueryString(params) {
  const searchParams = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, value);
    }
  });
  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}

export const dealsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getDeals: builder.query({
      query: (params) => `/deals${buildQueryString(params)}`,
      providesTags: (result) =>
        result?.data?.items
          ? [
              ...result.data.items.map((d) => ({ type: 'Deals', id: d._id })),
              { type: 'Deals', id: 'LIST' },
            ]
          : [{ type: 'Deals', id: 'LIST' }],
    }),
    getDeal: builder.query({
      query: (id) => `/deals/${id}`,
      providesTags: (result, error, id) => [{ type: 'Deals', id }],
    }),
    createDeal: builder.mutation({
      query: (body) => ({ url: '/deals', method: 'POST', body }),
      invalidatesTags: [{ type: 'Deals', id: 'LIST' }, { type: 'Dashboard', id: 'SUMMARY' }, { type: 'Dashboard', id: 'TEAM' }],
    }),
    updateDeal: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/deals/${id}`, method: 'PATCH', body }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Deals', id },
        { type: 'Deals', id: 'LIST' },
        { type: 'Timeline', id: `Deal-${id}` },
        { type: 'Dashboard', id: 'SUMMARY' },
        { type: 'Dashboard', id: 'TEAM' },
      ],
    }),
    changeDealStage: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/deals/${id}/stage`, method: 'PATCH', body }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Deals', id },
        { type: 'Deals', id: 'LIST' },
        { type: 'Timeline', id: `Deal-${id}` },
        { type: 'Dashboard', id: 'SUMMARY' },
        { type: 'Dashboard', id: 'TEAM' },
      ],
    }),
    assignDeal: builder.mutation({
      query: ({ id, assignedTo }) => ({ url: `/deals/${id}/assign`, method: 'PATCH', body: { assignedTo } }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Deals', id },
        { type: 'Deals', id: 'LIST' },
        { type: 'Timeline', id: `Deal-${id}` },
        { type: 'Dashboard', id: 'SUMMARY' },
        { type: 'Dashboard', id: 'TEAM' },
      ],
    }),
    getDealTimeline: builder.query({
      query: (id) => `/deals/${id}/timeline`,
      providesTags: (result, error, id) => [{ type: 'Timeline', id: `Deal-${id}` }],
    }),
  }),
});

export const {
  useGetDealsQuery,
  useGetDealQuery,
  useCreateDealMutation,
  useUpdateDealMutation,
  useChangeDealStageMutation,
  useAssignDealMutation,
  useGetDealTimelineQuery,
} = dealsApi;
