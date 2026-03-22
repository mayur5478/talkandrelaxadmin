import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getCookie } from "../cookie_helper/cookie";

export const contactApi = createApi({
  reducerPath: "contactApi",
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
    blockListenersList: builder.query({
      query: ({ page = 1, limit = 10, search }) => ({
        url: `/user/block/listener-list`,
        method: "GET",
        params: { page, limit, search },
      }),
    }),
    unblockListener: builder.mutation({
      query: (data) => ({
        url: `/user/unblock/listener`,
        method: "DELETE",
        body: data,
      }),
    }),
    blockUsersList: builder.query({
        query: ({ page = 1, limit = 10, search }) => ({
          url: `/listener/block/user-list`,
          method: "GET",
          params: { page, limit, search },
        }),
      }),
      unblockUser: builder.mutation({
        query: (data) => ({
          url: `/listener/unblock-user`,
          method: "DELETE",
          body: data, 
        }),
      }),
  }),
});

export const { useBlockListenersListQuery,useUnblockListenerMutation,useBlockUsersListQuery,useUnblockUserMutation } = contactApi;
