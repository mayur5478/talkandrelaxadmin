import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getCookie } from "../cookie_helper/cookie";

// Recharge nudge message CRUD (backend: routes/admin/recharge_nudge/rechargeNudgeMessage.js).
// Content shown in the app's home-screen "recharge nudge" dialog for
// not-yet-recharged users — editable here without an app release.
export const rechargeNudgeApi = createApi({
  reducerPath: "rechargeNudgeApi",
  tagTypes: ["RechargeNudgeMessages"],
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
    rechargeNudgeMessagesList: builder.query({
      query: () => ({ url: "admin/recharge-nudge-messages", method: "GET" }),
      providesTags: ["RechargeNudgeMessages"],
    }),
    createRechargeNudgeMessage: builder.mutation({
      query: (body) => ({ url: "admin/recharge-nudge-messages", method: "POST", body }),
      invalidatesTags: ["RechargeNudgeMessages"],
    }),
    updateRechargeNudgeMessage: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `admin/recharge-nudge-messages/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["RechargeNudgeMessages"],
    }),
    deleteRechargeNudgeMessage: builder.mutation({
      query: (id) => ({ url: `admin/recharge-nudge-messages/${id}`, method: "DELETE" }),
      invalidatesTags: ["RechargeNudgeMessages"],
    }),
  }),
});

export const {
  useRechargeNudgeMessagesListQuery,
  useCreateRechargeNudgeMessageMutation,
  useUpdateRechargeNudgeMessageMutation,
  useDeleteRechargeNudgeMessageMutation,
} = rechargeNudgeApi;
