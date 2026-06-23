import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getCookie } from "../cookie_helper/cookie";

export const monitoringApi = createApi({
  reducerPath: "monitoringApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.REACT_APP_SERVER_URL,
    prepareHeaders: (headers) => {
      const token = getCookie("token");
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["Alerts"],
  endpoints: (builder) => ({
    getLive: builder.query({ query: () => `monitoring/live` }),
    getListeners: builder.query({ query: (days = 7) => `monitoring/listeners?days=${days}` }),
    getBillingIntegrity: builder.query({ query: (days = 7) => `monitoring/billing-integrity?days=${days}` }),
    getCallQuality: builder.query({ query: (days = 7) => `call-metrics/admin/summary?days=${days}` }),
    getCallQualityList: builder.query({
      query: ({ days = 7, filter = "poor", page = 1 } = {}) =>
        `call-metrics/admin/list?days=${days}&filter=${filter}&page=${page}`,
    }),
    getSessionDetail: builder.query({ query: (id) => `monitoring/session/${id}` }),
    getAlerts: builder.query({
      query: ({ resolved = "false", page = 1 } = {}) => `monitoring/alerts?resolved=${resolved}&page=${page}`,
      providesTags: ["Alerts"],
    }),
    scanAlerts: builder.mutation({
      query: (days = 2) => ({ url: `monitoring/alerts/scan?days=${days}`, method: "POST" }),
      invalidatesTags: ["Alerts"],
    }),
    resolveAlert: builder.mutation({
      query: (id) => ({ url: `monitoring/alerts/${id}/resolve`, method: "POST" }),
      invalidatesTags: ["Alerts"],
    }),
  }),
});

export const {
  useGetLiveQuery,
  useGetListenersQuery,
  useGetBillingIntegrityQuery,
  useGetCallQualityQuery,
  useGetCallQualityListQuery,
  useGetSessionDetailQuery,
  useGetAlertsQuery,
  useScanAlertsMutation,
  useResolveAlertMutation,
} = monitoringApi;
