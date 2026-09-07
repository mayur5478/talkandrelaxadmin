import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getCookie } from "../cookie_helper/cookie";

// Admin → listener announcements (shown behind the T&R button in the listener app).
export const announcementApi = createApi({
  reducerPath: "announcementApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.REACT_APP_SERVER_URL,
    prepareHeaders: (headers) => {
      const token = getCookie("token");
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["Announcement"],
  endpoints: (builder) => ({
    getAnnouncements: builder.query({
      query: ({ page = 1, pageSize = 20 }) => `/announcement/list?page=${page}&pageSize=${pageSize}`,
      providesTags: ["Announcement"],
    }),
    createAnnouncement: builder.mutation({
      query: (body) => ({ url: `/announcement`, method: "POST", body }),
      invalidatesTags: ["Announcement"],
    }),
    updateAnnouncement: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/announcement/${id}`, method: "PUT", body }),
      invalidatesTags: ["Announcement"],
    }),
  }),
});

export const {
  useGetAnnouncementsQuery,
  useCreateAnnouncementMutation,
  useUpdateAnnouncementMutation,
} = announcementApi;
