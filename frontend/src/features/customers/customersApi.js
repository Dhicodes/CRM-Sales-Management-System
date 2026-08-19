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
      invalidatesTags: [{ type: 'Customers', id: 'LIST' }],
    }),
    updateCustomer: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/customers/${id}`, method: 'PATCH', body }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Customers', id },
        { type: 'Customers', id: 'LIST' },
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
      ],
    }),
    getCustomerDeals: builder.query({
      query: (id) => `/customers/${id}/deals`,
      providesTags: (result, error, id) => [{ type: 'Deals', id: `customer-${id}` }],
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
} = customersApi;
