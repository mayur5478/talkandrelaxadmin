import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getCookie } from "../cookie_helper/cookie";

export const rechargeApi = createApi({
  reducerPath: "rechargeApi",
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
  tagTypes: ["recharge"],
  endpoints: (builder) => ({
    rechargePlansList: builder.query({
      query: ({ page = 1, limit = 10, search }) => ({
        url: `/plans/list`,
        method: "GET",
        params: { page, limit, search },
      }),
    }),
    rechargePlansHighlight: builder.mutation({
      query: (id) => ({
        url: `/plans/highlight`,
        method: "POST",
        body: { id: id },
      }),
    }),
    createRechargePlan: builder.mutation({
      query: (amount) => ({
        url: `/plans/create`,
        method: "POST",
        body: { amount },
      }),
    }),
    editRechargePlan: builder.mutation({
      query: (amount) => ({
        url: `/plans/edit`,
        method: "PUT",
        body: { amount },
      }),
    }),
    editAdminCommission: builder.mutation({
      query: (id, charge) => ({
        url: `/admin/update-charge`,
        method: "POST",
        body: { id, charge },
      }),
    }),
    deleteRechargePlan: builder.mutation({
      query: (id) => ({
        url: `/plans/delete`,
        method: "DELETE",
        body: { id: id },
      }),
    }),
    giftPlansList: builder.query({
      query: ({ page = 1, limit = 10, search }) => ({
        url: `/admin/gift/list`,
        method: "GET",
        params: { page, limit, search },
      }),
    }),
    createGiftPlan: builder.mutation({
      query: (amount) => ({
        url: `/admin/gift/create`,
        method: "POST",
        body: { amount },
      }),
    }),
    deleteGiftPlan: builder.mutation({
      query: (id) => ({
        url: `/admin/gift/delete`,
        method: "DELETE",
        body: { id: id },
      }),
    }),
    editGiftPlan: builder.mutation({
      query: (amount) => ({
        url: `/admin/gift/edit`,
        method: "PUT",
        body: { amount },
      }),
    }),
    chargesList: builder.query({
      query: ({ page = 1, limit = 10, search }) => ({
        url: `/listener/charges-list`,
        method: "GET",
        params: { page, limit, search },
      }),
    }),
    editCharges: builder.mutation({
      query: ({ id, updates }) => ({
        url: `/user/update-charges`,
        method: "PUT",
        body: { id, updates },
      }),
    }),
    coupensList: builder.query({
      query: ({ page = 1, limit = 10, search }) => ({
        url: `/coupen/coupens/list`,
        method: "GET",
        params: { page, limit, search },
      }),
    }),
    createCoupen: builder.mutation({
      query: (payload) => ({
        url: `/coupen/coupen`,
        method: "POST",
        body: payload,
      }),
    }),
    editCoupen: builder.mutation({
      query: (payload) => ({
        url: `/coupen/coupen`,
        method: "PUT",
        body: payload,
      }),
    }),
    deleteCoupen: builder.mutation({
      query: (id) => ({
        url: `/coupen/coupen`,
        method: "DELETE",
        body: { id: id },
      }),
    }),
    userManualRefund: builder.mutation({
      query: ({ userId, amount, type }) => ({
        url: `/user/payment/user-refund`,
        method: "POST",
        body: { userId, amount, type },
      }),
    }),
    listenerManualRefund: builder.mutation({
      query: ({ listenerId, amount, type }) => ({
        url: `/user/payment/listener-refund`,
        method: "POST",
        body: { listenerId, amount, type },
      }),
    }),
    getManualAdjustments: builder.query({
      query: ({ page = 1, pageSize = 10 }) => ({
        url: `/user/payment/manual-adjustments`,
        method: "GET",
        params: { page, pageSize },
      }),
      providesTags: ["recharge"],
    }),
  }),
});

export const {
  useRechargePlansListQuery,
  useRechargePlansHighlightMutation,
  useDeleteRechargePlanMutation,
  useCreateRechargePlanMutation,
  useEditRechargePlanMutation,
  useEditAdminCommissionMutation,
  useGiftPlansListQuery,
  useCreateGiftPlanMutation,
  useDeleteGiftPlanMutation,
  useEditGiftPlanMutation,
  useChargesListQuery,
  useEditChargesMutation,
  useCoupensListQuery,
  useCreateCoupenMutation,
  useEditCoupenMutation,
  useDeleteCoupenMutation,
  useUserManualRefundMutation,
  useListenerManualRefundMutation,
  useGetManualAdjustmentsQuery,
} = rechargeApi;
