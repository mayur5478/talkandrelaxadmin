import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getCookie } from "../cookie_helper/cookie";

export const userApi = createApi({
  reducerPath: "userApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.REACT_APP_SERVER_URL,
    prepareHeaders: (headers) => {
      const token = getCookie("token");

      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      return headers;
    },
  }),
  endpoints: (builder) => ({
    userList: builder.query({
      query: ({ page = 1, pageSize = 10, searchParams, fromDate, toDate, archived }) => ({
        url: `user/user-list`,
        method: "GET",
        params: { page, pageSize, searchParams, fromDate, toDate, archived },
      }),
    }),
    recentUserList: builder.query({
      query: ({ page = 1, pageSize = 10, searchParams, date }) => ({
        url: `user/recent-user-list`,
        method: "GET",
        params: { page, pageSize, searchParams, date },
      }),
    }),
    activeUserList: builder.query({
      query: ({ page = 1, pageSize = 10, searchParams,  fromDate,toDate }) => ({
        url: `user/active-user-list`,
        method: "GET",
        params: { page, pageSize, searchParams,  fromDate,toDate },
      }),
    }),
    formData: builder.query({
      query: ({ id }) => ({
        url: `user/form-data`,
        method: "GET",
        params: { id },
      }),
    }),
    userDelete: builder.mutation({
      query: ({ id, status, mobile_number }) => ({
        url: `user/soft-delete-user`,
        method: "PUT",
        body: { id, status, mobile_number },
      }),
    }),
    userProfile: builder.query({
      query: (id) => ({
        url: `user/user-profile?id=${id}`,
        method: "GET",
      }),
    }),
    updateUser: builder.mutation({
      query: (formDataToSubmit) => ({
        url: "user/edit-user",
        method: "PUT",
        body: formDataToSubmit,
      }),
    }),
    softDeletedUsers: builder.query({
      query: () => ({
        url: `user/soft-deleted-users`,
        method: "GET",
      }),
    }),
  }),
});

export const {
  useUserListQuery,
  useActiveUserListQuery,
  useRecentUserListQuery,
  useFormDataQuery,
  useUserDeleteMutation,
  useUserProfileQuery,
  useUpdateUserMutation,
  useSoftDeletedUsersQuery
} = userApi;
