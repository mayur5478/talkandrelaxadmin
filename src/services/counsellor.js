import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getCookie } from "../cookie_helper/cookie";

// Counsellor admin API (backend admin/counsellor). Roles: admin, hr, counsellor_head (config/head/add: admin, hr).
// Every route answers 404 {message:"Not found"} until the counsellor feature flag is on for the server.
// All money is integer PAISE; shares are basis points.
const baseUrl = process.env.REACT_APP_SERVER_URL;

// Drop empty params so we never send "?status=&page=".
const qs = (params = {}) => {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "" && v !== "all") p.set(k, String(v));
  });
  const s = p.toString();
  return s ? `?${s}` : "";
};

export const counsellorApi = createApi({
  reducerPath: "counsellorApi",
  baseQuery: fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers) => {
      const token = getCookie("token");
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["Counsellors", "Counsellor", "Checkins", "Complaints", "Bookings", "Summary", "Config"],
  endpoints: (builder) => ({
    listCounsellors: builder.query({
      query: (args = {}) => `/admin/counsellor${qs(args)}`,
      providesTags: ["Counsellors"],
    }),
    getCounsellor: builder.query({
      query: (id) => `/admin/counsellor/${id}`,
      providesTags: (r, e, id) => [{ type: "Counsellor", id }],
    }),
    updateCounsellor: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/admin/counsellor/${id}`, method: "PUT", body }),
      invalidatesTags: (r, e, { id }) => ["Counsellors", { type: "Counsellor", id }],
    }),
    setCheck: builder.mutation({
      query: ({ id, type, ...body }) => ({ url: `/admin/counsellor/${id}/checks/${type}`, method: "PUT", body }),
      invalidatesTags: (r, e, { id }) => ["Counsellors", { type: "Counsellor", id }],
    }),
    goLive: builder.mutation({
      query: ({ id, displayName }) => ({ url: `/admin/counsellor/${id}/go-live`, method: "POST", body: displayName ? { displayName } : {} }),
      invalidatesTags: (r, e, { id }) => ["Counsellors", { type: "Counsellor", id }, "Summary"],
    }),
    removeCounsellor: builder.mutation({
      query: ({ id, reason }) => ({ url: `/admin/counsellor/${id}/remove`, method: "POST", body: { reason } }),
      invalidatesTags: (r, e, { id }) => ["Counsellors", { type: "Counsellor", id }, "Bookings"],
    }),
    getCheckins: builder.query({
      query: (id) => `/admin/counsellor/${id}/checkins`,
      providesTags: (r, e, id) => [{ type: "Checkins", id }],
    }),
    addCheckin: builder.mutation({
      query: ({ id, notes }) => ({ url: `/admin/counsellor/${id}/checkins`, method: "POST", body: { notes } }),
      invalidatesTags: (r, e, { id }) => [{ type: "Checkins", id }],
    }),
    listComplaints: builder.query({
      query: (args = {}) => `/admin/counsellor/complaints${qs(args)}`,
      providesTags: ["Complaints"],
    }),
    resolveComplaint: builder.mutation({
      query: ({ id, resolution }) => ({ url: `/admin/counsellor/complaints/${id}/resolve`, method: "POST", body: { resolution } }),
      invalidatesTags: ["Complaints"],
    }),
    listBookings: builder.query({
      query: (args = {}) => `/admin/counsellor/bookings${qs(args)}`,
      providesTags: ["Bookings"],
    }),
    getSummary: builder.query({
      query: () => "/admin/counsellor/summary",
      providesTags: ["Summary"],
    }),
    getConfig: builder.query({
      query: () => "/admin/counsellor/config",
      providesTags: ["Config"],
    }),
    setConfig: builder.mutation({
      query: ({ key, value }) => ({ url: "/admin/counsellor/config", method: "PUT", body: { key, value } }),
      invalidatesTags: ["Config"],
    }),
    resetConfig: builder.mutation({
      query: (key) => ({ url: `/admin/counsellor/config/${encodeURIComponent(key)}`, method: "DELETE" }),
      invalidatesTags: ["Config"],
    }),
    createHead: builder.mutation({
      query: (body) => ({ url: "/admin/counsellor/head", method: "POST", body }),
      invalidatesTags: ["Counsellors"],
    }),
    addCounsellor: builder.mutation({
      query: (body) => ({ url: "/admin/counsellor/add", method: "POST", body }),
      invalidatesTags: ["Counsellors"],
    }),
  }),
});

export const {
  useListCounsellorsQuery, useGetCounsellorQuery, useUpdateCounsellorMutation, useSetCheckMutation,
  useGoLiveMutation, useRemoveCounsellorMutation, useGetCheckinsQuery, useAddCheckinMutation,
  useListComplaintsQuery, useResolveComplaintMutation, useListBookingsQuery, useGetSummaryQuery,
  useGetConfigQuery, useSetConfigMutation, useResetConfigMutation, useCreateHeadMutation, useAddCounsellorMutation,
} = counsellorApi;
