import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getCookie } from "../cookie_helper/cookie";

// Background WhatsApp / SMS campaign runner. `startCampaign` kicks off a
// server-side send and returns a campaignId immediately; poll `getCampaign` for
// live accepted/rejected progress.
export const campaignApi = createApi({
  reducerPath: "campaignApi",
  tagTypes: ["Campaigns"],
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.REACT_APP_SERVER_URL,
    prepareHeaders: (headers) => {
      const token = getCookie("token");
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  endpoints: (builder) => ({
    startCampaign: builder.mutation({
      query: (payload) => ({
        url: "admin/campaign/start",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Campaigns"],
    }),
    listCampaigns: builder.query({
      query: ({ limit = 25 } = {}) => ({
        url: "admin/campaign",
        method: "GET",
        params: { limit },
      }),
      providesTags: ["Campaigns"],
    }),
    getCampaign: builder.query({
      query: (id) => ({ url: `admin/campaign/${id}`, method: "GET" }),
    }),
    getCampaignDelivery: builder.query({
      query: (id) => ({ url: `admin/campaign/${id}/delivery`, method: "GET" }),
    }),
    cancelCampaign: builder.mutation({
      query: (id) => ({ url: `admin/campaign/${id}/cancel`, method: "POST" }),
      invalidatesTags: ["Campaigns"],
    }),
  }),
});

export const {
  useStartCampaignMutation,
  useListCampaignsQuery,
  useGetCampaignQuery,
  useLazyGetCampaignQuery,
  useGetCampaignDeliveryQuery,
  useCancelCampaignMutation,
} = campaignApi;
