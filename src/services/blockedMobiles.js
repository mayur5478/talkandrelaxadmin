import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getCookie } from "../cookie_helper/cookie";

export const blockedMobilesApi = createApi({
  reducerPath: "blockedMobilesApi",
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
  tagTypes: ["BlockedMobile"],
  endpoints: (builder) => ({
    // GET blocked mobiles (paginated)
    getBlockedMobiles: builder.query({
      query: ({ page = 1, limit = 10 }) =>
        `/admin/blocked-mobiles?page=${page}&limit=${limit}`,
      providesTags: ["BlockedMobile"],
    }),

    // POST block a number — also freezes/kicks any existing account on it
    blockMobile: builder.mutation({
      query: ({ mobile, reason }) => ({
        url: `/admin/blocked-mobiles`,
        method: "POST",
        body: { mobile, reason },
      }),
      invalidatesTags: ["BlockedMobile"],
    }),

    // DELETE unblock a number
    unblockMobile: builder.mutation({
      query: (id) => ({
        url: `/admin/blocked-mobiles/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["BlockedMobile"],
    }),
  }),
});

export const {
  useGetBlockedMobilesQuery,
  useBlockMobileMutation,
  useUnblockMobileMutation,
} = blockedMobilesApi;
