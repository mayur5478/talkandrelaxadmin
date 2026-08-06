import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getCookie } from "../cookie_helper/cookie";

// App feedback API (read-only list).
// Backend route: GET /app-feedback -> { message, feedback: [...], pagination: { total, page, limit, totalPages } }
export const appFeedbackApi = createApi({
  reducerPath: "appFeedbackApi",
  tagTypes: ["AppFeedbackList"],
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
    getAppFeedback: builder.query({
      query: ({ page = 1, limit = 20, source_trigger } = {}) => {
        const params = { page, limit };
        if (source_trigger && source_trigger !== "all") params.source_trigger = source_trigger;
        return { url: "app-feedback", method: "GET", params };
      },
      providesTags: ["AppFeedbackList"],
    }),
  }),
});

export const { useGetAppFeedbackQuery } = appFeedbackApi;
