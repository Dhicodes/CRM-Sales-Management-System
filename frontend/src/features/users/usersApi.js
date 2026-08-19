import { api } from '../../app/api';

export const usersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAssignableUsers: builder.query({
      query: () => '/users/assignable',
      providesTags: [{ type: 'Users', id: 'ASSIGNABLE' }],
    }),
    getUsers: builder.query({
      query: () => '/users',
      providesTags: (result) =>
        result?.data
          ? [...result.data.map((u) => ({ type: 'Users', id: u._id })), { type: 'Users', id: 'LIST' }]
          : [{ type: 'Users', id: 'LIST' }],
    }),
    createUser: builder.mutation({
      query: (body) => ({ url: '/users', method: 'POST', body }),
      invalidatesTags: [
        { type: 'Users', id: 'LIST' },
        { type: 'Users', id: 'ASSIGNABLE' },
      ],
    }),
    updateUser: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/users/${id}`, method: 'PATCH', body }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Users', id },
        { type: 'Users', id: 'LIST' },
        { type: 'Users', id: 'ASSIGNABLE' },
      ],
    }),
    deactivateUser: builder.mutation({
      query: (id) => ({ url: `/users/${id}/deactivate`, method: 'PATCH' }),
      invalidatesTags: (result, error, id) => [
        { type: 'Users', id },
        { type: 'Users', id: 'LIST' },
        { type: 'Users', id: 'ASSIGNABLE' },
      ],
    }),
  }),
});

export const {
  useGetAssignableUsersQuery,
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeactivateUserMutation,
} = usersApi;
