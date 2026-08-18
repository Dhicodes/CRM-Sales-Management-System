import { api } from '../../app/api';

export const usersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAssignableUsers: builder.query({
      query: () => '/users/assignable',
      providesTags: [{ type: 'Users', id: 'ASSIGNABLE' }],
    }),
  }),
});

export const { useGetAssignableUsersQuery } = usersApi;
