import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getCookie } from "../cookie_helper/cookie";

export const notificationApi = createApi({
  reducerPath: "notificationApi",
  tagTypes: ["PushHistory"],
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
    getPushStats: builder.query({
      query: () => ({
        url: "admin/push-notification/stats",
        method: "GET",
      }),
    }),
    sendToUsers: builder.mutation({
      query: (payload) => ({
        url: "admin/push-notification/send-to-users",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["PushHistory"],
    }),
    sendToListeners: builder.mutation({
      query: (payload) => ({
        url: "admin/push-notification/send-to-listeners",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["PushHistory"],
    }),
    sendToAll: builder.mutation({
      query: (payload) => ({
        url: "admin/push-notification/send-to-all",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["PushHistory"],
    }),
    searchRecipients: builder.query({
      query: ({ q = "", role = "all" }) => ({
        url: "admin/push-notification/search-recipients",
        method: "GET",
        params: { q, role },
      }),
    }),
    sendToSelected: builder.mutation({
      query: (payload) => ({
        url: "admin/push-notification/send-to-selected",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["PushHistory"],
    }),
    getPushHistory: builder.query({
      query: ({ page = 1, pageSize = 20 } = {}) => ({
        url: "admin/push-notification/history",
        method: "GET",
        params: { page, pageSize },
      }),
      providesTags: ["PushHistory"],
    }),
    retryNotification: builder.mutation({
      query: (id) => ({
        url: `admin/push-notification/retry/${id}`,
        method: "POST",
      }),
      invalidatesTags: ["PushHistory"],
    }),
  }),
});

export const {
  useGetPushStatsQuery,
  useSendToUsersMutation,
  useSendToListenersMutation,
  useSendToAllMutation,
  useSearchRecipientsQuery,
  useSendToSelectedMutation,
  useGetPushHistoryQuery,
  useRetryNotificationMutation,
} = notificationApi;
