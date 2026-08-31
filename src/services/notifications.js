import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getCookie } from "../cookie_helper/cookie";

export const notificationsApi = createApi({
  reducerPath: "notificationsApi",
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
    // POST send a notification — either { listenerId, title, body } for one
    // listener, or { broadcast: true, title, body } for every listener.
    sendNotification: builder.mutation({
      query: (payload) => ({
        url: `/admin/notifications/send`,
        method: "POST",
        body: payload,
      }),
    }),
  }),
});

export const { useSendNotificationMutation } = notificationsApi;
