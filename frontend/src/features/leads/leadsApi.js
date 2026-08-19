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

export const leadsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getLeads: builder.query({
      query: (params) => `/leads${buildQueryString(params)}`,
      providesTags: (result) =>
        result?.data?.items
          ? [
              ...result.data.items.map((lead) => ({ type: 'Leads', id: lead._id })),
              { type: 'Leads', id: 'LIST' },
            ]
          : [{ type: 'Leads', id: 'LIST' }],
    }),
    getLead: builder.query({
      query: (id) => `/leads/${id}`,
      providesTags: (result, error, id) => [{ type: 'Leads', id }],
    }),
    createLead: builder.mutation({
      query: (body) => ({ url: '/leads', method: 'POST', body }),
      invalidatesTags: [{ type: 'Leads', id: 'LIST' }],
    }),
    updateLead: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/leads/${id}`, method: 'PATCH', body }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Leads', id },
        { type: 'Leads', id: 'LIST' },
        { type: 'Timeline', id: `Lead-${id}` },
      ],
    }),
    assignLead: builder.mutation({
      query: ({ id, assignedTo }) => ({
        url: `/leads/${id}/assign`,
        method: 'PATCH',
        body: { assignedTo },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Leads', id },
        { type: 'Leads', id: 'LIST' },
        { type: 'Timeline', id: `Lead-${id}` },
      ],
    }),
    addLeadNote: builder.mutation({
      query: ({ id, text }) => ({ url: `/leads/${id}/notes`, method: 'POST', body: { text } }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Leads', id },
        { type: 'Timeline', id: `Lead-${id}` },
      ],
    }),
    convertLead: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/leads/${id}/convert`, method: 'POST', body }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Leads', id },
        { type: 'Leads', id: 'LIST' },
        { type: 'Customers', id: 'LIST' },
        { type: 'Timeline', id: `Lead-${id}` },
      ],
    }),
    getLeadTimeline: builder.query({
      query: (id) => `/leads/${id}/timeline`,
      providesTags: (result, error, id) => [{ type: 'Timeline', id: `Lead-${id}` }],
    }),
  }),
});

export const {
  useGetLeadsQuery,
  useGetLeadQuery,
  useCreateLeadMutation,
  useUpdateLeadMutation,
  useAssignLeadMutation,
  useAddLeadNoteMutation,
  useConvertLeadMutation,
  useGetLeadTimelineQuery,
} = leadsApi;
