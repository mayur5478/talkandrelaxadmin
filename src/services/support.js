import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getCookie } from "../cookie_helper/cookie";

// Support chat / ticket resolution API.
// Backend routes live under /api/v2/support/tickets (see backend
// routes/support/supportTicket.js).
export const supportApi = createApi({
  reducerPath: "supportApi",
  tagTypes: ["SupportList", "SupportTicket", "SupportStats"],
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
    getSupportTickets: builder.query({
      query: ({ page = 1, limit = 20, status, requester_role, priority, search } = {}) => {
        const params = { page, limit };
        if (status && status !== "all") params.status = status;
        if (requester_role && requester_role !== "all") params.requester_role = requester_role;
        if (priority && priority !== "all") params.priority = priority;
        if (search && search.trim()) params.search = search.trim();
        return { url: "support/tickets", method: "GET", params };
      },
      providesTags: ["SupportList"],
    }),

    getSupportTicket: builder.query({
      query: (id) => ({ url: `support/tickets/${id}`, method: "GET" }),
      providesTags: (result, error, id) => [{ type: "SupportTicket", id }],
    }),

    getSupportStats: builder.query({
      query: () => ({ url: "support/tickets/stats", method: "GET" }),
      providesTags: ["SupportStats"],
    }),

    sendSupportMessage: builder.mutation({
      // formData is a FormData instance: { message?, attachment? (File) }
      query: ({ ticketId, formData }) => ({
        url: `support/tickets/${ticketId}/messages`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: (result, error, { ticketId }) => [
        { type: "SupportTicket", id: ticketId },
        "SupportList",
        "SupportStats",
      ],
    }),

    updateSupportTicket: builder.mutation({
      // body: { status?, priority?, assigned_admin_id? }
      query: ({ ticketId, ...body }) => ({
        url: `support/tickets/${ticketId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { ticketId }) => [
        { type: "SupportTicket", id: ticketId },
        "SupportList",
        "SupportStats",
      ],
    }),

    markSupportRead: builder.mutation({
      query: (ticketId) => ({
        url: `support/tickets/${ticketId}/read`,
        method: "POST",
      }),
      invalidatesTags: (result, error, ticketId) => [
        { type: "SupportTicket", id: ticketId },
        "SupportList",
      ],
    }),
  }),
});

export const {
  useGetSupportTicketsQuery,
  useGetSupportTicketQuery,
  useGetSupportStatsQuery,
  useSendSupportMessageMutation,
  useUpdateSupportTicketMutation,
  useMarkSupportReadMutation,
} = supportApi;
