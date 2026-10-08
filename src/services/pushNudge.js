import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getCookie } from "../cookie_helper/cookie";

// Push nudge results (backend: routes/admin/recharge_nudge/pushNudge.js).
export const pushNudgeApi = createApi({
  reducerPath: "pushNudgeApi",
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
    pushNudgeSummary: builder.query({
      query: () => ({ url: "admin/push-nudge/summary", method: "GET" }),
    }),
  }),
});

export const { usePushNudgeSummaryQuery } = pushNudgeApi;
