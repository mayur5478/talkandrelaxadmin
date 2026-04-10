import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { setCookie, getCookie } from "../cookie_helper/cookie";

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.REACT_APP_SERVER_URL,
    prepareHeaders: (headers) => {
      const token = getCookie("token"); // Fetch the token from cookies

      if (token) {
        headers.set("Authorization", `Bearer ${token}`); // Add the Authorization header
      }

      return headers;
    },
  }),
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: `admin/login`,
        method: "POST",
        body: credentials,
      }),
      async onQueryStarted(args, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          console.log("data-----------", data.token);

          setCookie("token", data?.token);
          setCookie("userId", data?.admin?.id);

          // Automatically initiate fetching of user details
          dispatch(authApi.endpoints.getMe.initiate());
        } catch (error) {
          console.error("Login failed", error);
        }
      },
    }),
    getMe: builder.query({
      query: () => ({
        url: `/admin/get-login-detail`,
        method: "GET",
      }),
    }),
    accountFreeze: builder.mutation({
      query: (id) => ({
        url: `user/account-freeze`,
        method: "POST",
        body: { id },
      }),
    }),
    walletFreeze: builder.mutation({
      query: (id) => ({
        url: `user/wallet-freeze`,
        method: "POST",
        body: { id },
      }),
    }),
    updateListenerProfile: builder.mutation({
      query: (formDataToSubmit) => ({
        url: "user/listener-profile-update",
        method: "PUT",
        body: formDataToSubmit,
      }),
    }),
    dashboard: builder.query({
      query: () => ({
        url: `/admin/dashboard`,
        method: "GET",
      }),
    }),
    graph: builder.query({
      query: ({ type }) => ({
        url: `/admin/graph`,
        method: "GET",
        params: { type },
      }),
    }),
    resetAdminPassword: builder.mutation({
      query: ({ adminId, newPassword, oldPassword }) => ({
        url: "admin/reset-password",
        method: "POST",
        body: { adminId, newPassword, oldPassword },
      }),
    }),
    logoutAdmin: builder.mutation({
      query: ({ adminId }) => ({
        url: "admin/logout",
        method: "POST",
        body: { adminId },
      }),
    }),

    searchUsers: builder.query({
      query: (search) => ({
        url: `user/search-users?query=${search}`,
        method: "GET",
      }),
    }),

    searchListeners: builder.query({
      query: (search) => ({
        url: `user/search-listeners?query=${search}`,
        method: "GET",
      }),
    }),
    adjustWallet: builder.mutation({
      query: ({ userId, amount, type, reason }) => ({
        url: `admin/adjust-wallet`,
        method: "POST",
        body: { userId, amount, type, reason },
      }),
    }),
    forceEndSession: builder.mutation({
      query: ({ sessionId, userId, listenerId, reason }) => ({
        url: `admin/force-end-session`,
        method: "POST",
        body: { sessionId, userId, listenerId, reason },
      }),
    }),
    resetUserState: builder.mutation({
      query: (userId) => ({
        url: `admin/reset-user-state`,
        method: "POST",
        body: { userId },
      }),
    }),
    resetAllStuckStates: builder.mutation({
      query: () => ({
        url: `admin/reset-all-stuck-states`,
        method: "POST",
      }),
    }),
    cleanupLeakedUserImages: builder.mutation({
      query: () => ({
        url: `admin/cleanup-leaked-user-images`,
        method: "POST",
      }),
    }),

    getSessionRejections: builder.query({
      query: ({ page, limit, fromDate, toDate, search, type }) => {
        const params = new URLSearchParams({ page, limit });
        if (fromDate) params.append("fromDate", fromDate);
        if (toDate) params.append("toDate", toDate);
        if (search) params.append("search", search);
        if (type && type !== "all") params.append("type", type);
        return { url: `admin/get-session-rejections?${params.toString()}`, method: "GET" };
      },
    }),
    walletReport: builder.query({
      query: () => ({
        url: `admin/wallet-report`,
        method: "GET",
      }),
    }),
    allWallets: builder.query({
      query: ({ type = 'user', limit = 100 }) => ({
        url: `admin/all-wallets`,
        method: "GET",
        params: { type, limit },
      }),
    }),
    diagnoseConnection: builder.query({
      query: ({ userId, listenerId }) => ({
        url: `admin/diagnose-connection?userId=${userId}&listenerId=${listenerId}`,
        method: "GET",
      }),
    }),
  }),
});

export const {
  useAccountFreezeMutation,
  useWalletFreezeMutation,
  useLoginMutation,
  useGetMeQuery,
  useUpdateListenerProfileMutation,
  useDashboardQuery,
  useGraphQuery,
  useLogoutAdminMutation,
  useResetAdminPasswordMutation,
  useLazySearchUsersQuery,
  useLazySearchListenersQuery,
  useAdjustWalletMutation,
  useForceEndSessionMutation,
  useResetUserStateMutation,
  useResetAllStuckStatesMutation,
  useCleanupLeakedUserImagesMutation,

  useGetSessionRejectionsQuery,
  useWalletReportQuery,
  useAllWalletsQuery,
  useLazyDiagnoseConnectionQuery,
} = authApi;
