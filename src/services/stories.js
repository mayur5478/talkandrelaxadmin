import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getCookie } from "../cookie_helper/cookie";

export const storyApi = createApi({
  reducerPath: "storyApi",
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
  tagTypes: ["Story"], // Changed from Banner to Story so caching is relevant
  endpoints: (builder) => ({
    // GET all stories (paginated)
    getStories: builder.query({
      query: ({ page = 1, pageSize = 10, search = "" }) =>
        `/listener/stories?page=${page}&pageSize=${pageSize}&search=${search}`,
      providesTags: ["Story"],
    }),

    // DELETE a story
    deleteStory: builder.mutation({
      query: (id) => ({
        url: `/listener/story/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Story"],
    }),

    // POST add story (multipart/form-data)
    addStory: builder.mutation({
      query: (formData) => ({
        url: `/listener/story`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Story"],
    }),

    // POST approve story
    approveStory: builder.mutation({
      query: (listenerId) => ({
        url: `/listener/approve-story`,
        method: "POST",
        body: { listenerId },
      }),
      invalidatesTags: ["Story"],
    }),
  }),
});

export const {
  useGetStoriesQuery,
  useDeleteStoryMutation,
  useAddStoryMutation,
  useApproveStoryMutation,
} = storyApi;
