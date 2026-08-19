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

export const customersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getCustomers: builder.query({
      query: (params) => `/customers${buildQueryString(params)}`,
      providesTags: (result) =>
        result?.data?.items
          ? [
              ...result.data.items.map((c) => ({ type: 'Customers', id: c._id })),
              { type: 'Customers', id: 'LIST' },
            ]
          : [{ type: 'Customers', id: 'LIST' }],
    }),
    getCustomer: builder.query({
      query: (id) => `/customers/${id}`,
      providesTags: (result, error, id) => [{ type: 'Customers', id }],
    }),
    createCustomer: builder.mutation({
      query: (body) => ({ url: '/customers', method: 'POST', body }),
      invalidatesTags: [{ type: 'Customers', id: 'LIST' }, { type: 'Dashboard', id: 'SUMMARY' }, { type: 'Dashboard', id: 'TEAM' }],
    }),
    updateCustomer: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/customers/${id}`, method: 'PATCH', body }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Customers', id },
        { type: 'Customers', id: 'LIST' },
        { type: 'Timeline', id: `Customer-${id}` },
      ],
    }),
    assignCustomer: builder.mutation({
      query: ({ id, assignedTo }) => ({
        url: `/customers/${id}/assign`,
        method: 'PATCH',
        body: { assignedTo },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Customers', id },
        { type: 'Customers', id: 'LIST' },
        { type: 'Timeline', id: `Customer-${id}` },
        { type: 'Dashboard', id: 'SUMMARY' },
        { type: 'Dashboard', id: 'TEAM' },
      ],
    }),
    getCustomerDeals: builder.query({
      query: (id) => `/customers/${id}/deals`,
      // Also tagged with the generic Deals LIST id so any deal mutation
      // (create/update/stage/assign) refreshes this list too, since those
      // mutations don't know which customer's cache entry to target.
      providesTags: (result, error, id) => [
        { type: 'Deals', id: `customer-${id}` },
        { type: 'Deals', id: 'LIST' },
      ],
    }),
    getCustomerTimeline: builder.query({
      query: (id) => `/customers/${id}/timeline`,
      providesTags: (result, error, id) => [{ type: 'Timeline', id: `Customer-${id}` }],
    }),
  }),
});

export const {
  useGetCustomersQuery,
  useGetCustomerQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useAssignCustomerMutation,
  useGetCustomerDealsQuery,
  useGetCustomerTimelineQuery,
} = customersApi;
