import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getCookie } from "../cookie_helper/cookie";

export const communityApi = createApi({
  reducerPath: "communityApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.REACT_APP_SERVER_URL,
    prepareHeaders: (headers) => {
      const token = getCookie("token"); // Fetch the token from cookies

      if (token) {
        headers.set("Authorization", `Bearer ${token}`); // Add the Authorization header
      }

      return headers;
    },
  }),
  tagTypes: ["Community"],
  endpoints: (builder) => ({
    getCommunityPosts: builder.query({
      query: ({ status = "pending", page = 1, pageSize = 10 } = {}) =>
        `/community/admin/posts?status=${status}&page=${page}&pageSize=${pageSize}`,
      providesTags: ["Community"],
    }),
    createCommunityPost: builder.mutation({
      query: (formData) => ({ url: "/community/posts", method: "POST", body: formData }),
      invalidatesTags: ["Community"],
    }),
    approveCommunityPost: builder.mutation({
      query: (id) => ({ url: `/community/admin/posts/${id}/approve`, method: "POST" }),
      invalidatesTags: ["Community"],
    }),
    rejectCommunityPost: builder.mutation({
      query: ({ id, reason }) => ({ url: `/community/admin/posts/${id}/reject`, method: "POST", body: { reason } }),
      invalidatesTags: ["Community"],
    }),
    igApproveCommunityPost: builder.mutation({
      query: ({ id, approved }) => ({ url: `/community/admin/posts/${id}/ig-approve`, method: "POST", body: { approved } }),
      invalidatesTags: ["Community"],
    }),
    igDownloadCommunityPost: builder.mutation({
      query: (id) => ({ url: `/community/admin/posts/${id}/ig-download`, method: "GET" }),
      invalidatesTags: ["Community"],
    }),
  }),
});

export const {
  useGetCommunityPostsQuery,
  useCreateCommunityPostMutation,
  useApproveCommunityPostMutation,
  useRejectCommunityPostMutation,
  useIgApproveCommunityPostMutation,
  useIgDownloadCommunityPostMutation,
} = communityApi;
