import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getCookie } from "../cookie_helper/cookie";

// Admin switch for the recharge-funnel experiment (backend:
// controllers/admin/recharge_funnel_config). One singleton row decides
// whether not-yet-recharged users see the listener auto-connect arm, the AI
// nudge arm, both split as an A/B test, or neither.
export const rechargeFunnelConfigApi = createApi({
  reducerPath: "rechargeFunnelConfigApi",
  tagTypes: ["RechargeFunnelConfig", "RechargeFunnelResults"],
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
    getRechargeFunnelConfig: builder.query({
      query: () => ({ url: "admin/recharge-funnel-config", method: "GET" }),
      providesTags: ["RechargeFunnelConfig"],
    }),
    updateRechargeFunnelConfig: builder.mutation({
      query: (body) => ({ url: "admin/recharge-funnel-config", method: "PUT", body }),
      invalidatesTags: ["RechargeFunnelConfig"],
    }),
    getRechargeFunnelResults: builder.query({
      query: () => ({ url: "admin/recharge-funnel-results", method: "GET" }),
      providesTags: ["RechargeFunnelResults"],
    }),
  }),
});

export const {
  useGetRechargeFunnelConfigQuery,
  useUpdateRechargeFunnelConfigMutation,
  useGetRechargeFunnelResultsQuery,
} = rechargeFunnelConfigApi;
