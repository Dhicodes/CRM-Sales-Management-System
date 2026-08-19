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

export const activitiesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getActivities: builder.query({
      query: (params) => `/activities${buildQueryString(params)}`,
      providesTags: (result) =>
        result?.data?.items
          ? [
              ...result.data.items.map((a) => ({ type: 'Activities', id: a._id })),
              { type: 'Activities', id: 'LIST' },
            ]
          : [{ type: 'Activities', id: 'LIST' }],
    }),
    createActivity: builder.mutation({
      query: (body) => ({ url: '/activities', method: 'POST', body }),
      // Creating a follow-up also logs a Timeline event on the related
      // entity, so invalidate that entity's timeline cache too.
      invalidatesTags: (result, error, body) => [
        { type: 'Activities', id: 'LIST' },
        { type: 'Timeline', id: `${body.relatedToType}-${body.relatedToId}` },
      ],
    }),
    updateActivity: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/activities/${id}`, method: 'PATCH', body }),
      invalidatesTags: (result) =>
        result?.data
          ? [
              { type: 'Activities', id: result.data._id },
              { type: 'Activities', id: 'LIST' },
              { type: 'Timeline', id: `${result.data.relatedToType}-${result.data.relatedToId}` },
            ]
          : [{ type: 'Activities', id: 'LIST' }],
    }),
    deleteActivity: builder.mutation({
      query: (id) => ({ url: `/activities/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Activities', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetActivitiesQuery,
  useCreateActivityMutation,
  useUpdateActivityMutation,
  useDeleteActivityMutation,
} = activitiesApi;
