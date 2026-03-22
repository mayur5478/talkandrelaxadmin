import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getCookie } from "../cookie_helper/cookie";

export const listenerApi = createApi({
  reducerPath: "listenerApi",
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
    listenerList: builder.query({
      query: ({ page = 1, pageSize = 10, searchParams, fromDate,toDate, archived }) => ({
        url: `listener/listener-list`,
        method: "GET",
        params: { page, pageSize, searchParams, fromDate,toDate, archived },
      }),
    }),
    applications: builder.query({
      query: ({ page = 1, pageSize = 10, searchParams, date }) => ({
        url: `listener/listener-applications`,
        method: "GET",
        params: { page, pageSize, searchParams, date },
      }),
    }),
    profileApprovals: builder.query({
      query: ({ page = 1, pageSize = 10, searchParams, date }) => ({
        url: `listener/listener-profiles`,
        method: "GET",
        params: { page, pageSize, searchParams, date },
      }),
    }),
    listenerFormLink: builder.mutation({
      query: (userId) => ({
        url: `listener/listener-form-link`,
        method: "POST",
        body: { id: userId },
      }),
    }),
    listenerProfileFormLink: builder.mutation({
      query: (userId) => ({
        url: `listener/listener-profile-form-link`,
        method: "POST",
        body: { id: userId },
      }),
    }),

    rejectRequest: builder.mutation({
      query: ({ userId, reason, text }) => ({
        url: `listener/reject-request`,
        method: "POST",
        body: { userId, reason, text },
      }),
    }),
    listenerProfileApproval: builder.mutation({
      query: (userId) => ({
        url: `listener/listener-request-approval`,
        method: "POST",
        body: { userId },
      }),
    }),
    listenerProfile: builder.query({
      query: (id) => ({
        url: `listener/listener-profile/${id}`,
        method: "GET",
      }),
    }),
    listenerDelete: builder.mutation({
      query: (id) => ({
        url: `user/hard-delete-user`,
        method: "DELETE",
        body: { id },
      }),
    }),
    listenerSoftDelete: builder.mutation({
      query: ({ id, status, mobile_number }) => ({
        url: `user/soft-delete-listener`,
        method: "PUT",
        body: { id, status, mobile_number },
      }),
    }),
    sessionList: builder.query({
      query: ({ page = 1, limit = 10, search, searchUser, searchListener, fromDate, toDate }) => ({
        url: `listener/sessions-list`,
        method: "GET",
        params: { page, limit, search, searchUser, searchListener, fromDate, toDate },
      }),
    }),
    giftList: builder.query({
      query: ({ page = 1, limit = 10, search }) => ({
        url: `listener/gifts-list`,
        method: "GET",
        params: { page, limit, search },
      }),
    }),
    rechargeList: builder.query({
      query: ({ page = 1, limit = 10, search, fromDate, toDate }) => ({
        url: `listener/recharges-list`,
        method: "GET",
        params: { page, limit, search, fromDate, toDate },
      }),
    }),
    payoutsList: builder.query({
      query: ({ page = 1, limit = 10, search, fromDate, toDate }) => ({
        url: `listener/payouts-list`,
        method: "GET",
        params: { page, limit, search, fromDate, toDate },
      }),
    }),
    revenue: builder.query({
      query: () => ({
        url: `listener/revenue`,
        method: "GET",
      }),
    }),
    editSalary: builder.mutation({
      query: ({ id, updates }) => ({
        url: `/listener/update-payout`,
        method: "PUT",
        body: { id, updates },
      }),
    }),
    getSinglePayout: builder.query({
      query: (id) => ({
        url: `/listener/single-payout?id=${id}`,
        method: "GET",
      }),
    }),
    paySalaryUser: builder.mutation({
      query: (details) => ({
        url: "/listener/salary-payout",
        method: "POST",
        body: details,
      }),
    }),
    paySalary: builder.mutation({
      query: ({ id, amount ,transaction_id}) => ({
        url: `/listener/pay-salary`, 
        method: "POST",
        body: { id, amount,transaction_id },
      }),
    }),
    createSession: builder.mutation({
      query: (data) => ({
        url: "/session/create-session",
        method: "POST",
        body: data,
      }),
    }),
  }),
});

export const {
  useListenerListQuery,
  useListenerFormLinkMutation,
  useProfileApprovalsQuery,
  useApplicationsQuery,
  useListenerProfileFormLinkMutation,
  useRejectRequestMutation,
  useListenerProfileApprovalMutation,
  useListenerProfileQuery,
  useListenerDeleteMutation,
  useListenerSoftDeleteMutation,
  useSessionListQuery,
  useGiftListQuery,
  useRechargeListQuery,
  useRevenueQuery,
  usePayoutsListQuery,
  useEditSalaryMutation,
  useGetSinglePayoutQuery,
  usePaySalaryUserMutation,
  usePaySalaryMutation,
  useCreateSessionMutation
} = listenerApi;
