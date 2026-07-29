import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getCookie } from "../cookie_helper/cookie";

// Admin "system reset" endpoints — restore a stuck user/listener and run the
// safe runtime-state cleanup sweep. Backend: routes/admin/systemReset.js.
export const systemResetApi = createApi({
  reducerPath: "systemResetApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.REACT_APP_SERVER_URL,
    prepareHeaders: (headers) => {
      const token = getCookie("token");
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  endpoints: (builder) => ({
    // { query: "<name|id>", force?: bool }
    resetUser: builder.mutation({
      query: (body) => ({ url: `admin/system-reset/reset-user`, method: "POST", body }),
    }),
    // { dry?: bool }
    cleanupSweep: builder.mutation({
      query: (body = {}) => ({ url: `admin/system-reset/cleanup-sweep`, method: "POST", body }),
    }),
  }),
});

export const { useResetUserMutation, useCleanupSweepMutation } = systemResetApi;
