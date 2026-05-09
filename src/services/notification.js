import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getCookie } from "../cookie_helper/cookie";

// Helper: convert a payload (with optional image File) into a FormData body.
// RTK Query / fetchBaseQuery passes FormData straight through to fetch(),
// which sets the multipart Content-Type (with boundary) automatically.
function buildFormData(payload) {
  const fd = new FormData();
  if (payload.title != null) fd.append("title", payload.title);
  if (payload.body  != null) fd.append("body",  payload.body);
  if (payload.userIds && Array.isArray(payload.userIds)) {
    fd.append("userIds", JSON.stringify(payload.userIds));
  }
  if (payload.data != null) {
    fd.append("data", typeof payload.data === "string" ? payload.data : JSON.stringify(payload.data));
  }
  if (payload.image instanceof File || payload.image instanceof Blob) {
    fd.append("image", payload.image);
  }
  return fd;
}

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
        body: buildFormData(payload),
      }),
      invalidatesTags: ["PushHistory"],
    }),
    sendToListeners: builder.mutation({
      query: (payload) => ({
        url: "admin/push-notification/send-to-listeners",
        method: "POST",
        body: buildFormData(payload),
      }),
      invalidatesTags: ["PushHistory"],
    }),
    sendToAll: builder.mutation({
      query: (payload) => ({
        url: "admin/push-notification/send-to-all",
        method: "POST",
        body: buildFormData(payload),
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
        body: buildFormData(payload),
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
    // Soft cancel — preserves the log entry (audit trail) but blocks future retries
    cancelNotification: builder.mutation({
      query: ({ id, reason }) => ({
        url: `admin/push-notification/cancel/${id}`,
        method: "POST",
        body: { reason: reason || null },
      }),
      invalidatesTags: ["PushHistory"],
    }),
    // Hard delete — removes the log entry entirely. Use sparingly.
    deleteNotification: builder.mutation({
      query: (id) => ({
        url: `admin/push-notification/${id}`,
        method: "DELETE",
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
  useCancelNotificationMutation,
  useDeleteNotificationMutation,
} = notificationApi;
