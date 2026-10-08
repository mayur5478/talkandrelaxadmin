import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getCookie } from "../cookie_helper/cookie";

// Payout admin API (backend routes/admin/payout/payout.js). Roles: admin, finance.
// Every route answers 404 until PAYOUT_ADMIN_ENABLED=true on the server.
const baseUrl = process.env.REACT_APP_SERVER_URL;

export const payoutApi = createApi({
  reducerPath: "payoutApi",
  baseQuery: fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers) => {
      const token = getCookie("token");
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["Cycles", "Cycle", "Lines", "Batch", "Profile"],
  endpoints: (builder) => ({
    getPayoutConfig: builder.query({ query: () => "/admin/payout/config" }),
    listCycles: builder.query({ query: () => "/admin/payout/cycles", providesTags: ["Cycles"] }),
    getCycle: builder.query({ query: (id) => `/admin/payout/cycles/${id}`, providesTags: (r, e, id) => [{ type: "Cycle", id }] }),
    getLines: builder.query({
      query: ({ id, held }) => `/admin/payout/cycles/${id}/lines${held ? `?held=${held}` : ""}`,
      providesTags: (r, e, { id }) => [{ type: "Lines", id }],
    }),
    getLineTxns: builder.query({ query: ({ id, listenerId }) => `/admin/payout/cycles/${id}/lines/${encodeURIComponent(listenerId)}/txns` }),
    getBatchLines: builder.query({ query: (id) => `/admin/payout/cycles/${id}/batch-lines`, providesTags: (r, e, id) => [{ type: "Batch", id }] }),
    getBatches: builder.query({ query: (id) => `/admin/payout/cycles/${id}/batches`, providesTags: (r, e, id) => [{ type: "Batch", id }] }),
    // every listener ever individually approved in this cycle, regardless of version/recompute -- the
    // one list that never loses someone once they're approved
    getApprovedListeners: builder.query({
      query: (id) => `/admin/payout/cycles/${id}/approved-listeners`,
      providesTags: (r, e, id) => [{ type: "Lines", id }, { type: "Batch", id }],
    }),

    prepareCycle: builder.mutation({
      query: (body = {}) => ({ url: "/admin/payout/cycles/prepare", method: "POST", body }),
      invalidatesTags: ["Cycles", "Cycle", "Lines"],
    }),
    approveCycle: builder.mutation({
      query: (id) => ({ url: `/admin/payout/cycles/${id}/approve`, method: "POST" }),
      invalidatesTags: (r, e, id) => ["Cycles", { type: "Cycle", id }, { type: "Lines", id }],
    }),
    approveLine: builder.mutation({
      query: ({ id, listenerId }) => ({ url: `/admin/payout/cycles/${id}/lines/${encodeURIComponent(listenerId)}/approve`, method: "POST" }),
      invalidatesTags: (r, e, { id }) => ["Cycles", { type: "Cycle", id }, { type: "Lines", id }],
    }),
    generateFile: builder.mutation({
      query: ({ id, templateCode }) => ({ url: `/admin/payout/cycles/${id}/file`, method: "POST", body: { templateCode } }),
      invalidatesTags: (r, e, { id }) => ["Cycles", { type: "Cycle", id }, { type: "Batch", id }],
    }),
    generatePartialFile: builder.mutation({
      query: ({ id, templateCode }) => ({ url: `/admin/payout/cycles/${id}/file/partial`, method: "POST", body: { templateCode } }),
      invalidatesTags: (r, e, { id }) => ["Cycles", { type: "Cycle", id }, { type: "Lines", id }, { type: "Batch", id }],
    }),
    bankResult: builder.mutation({
      query: ({ lineId, outcome, reference, reason }) => ({ url: `/admin/payout/batch-lines/${lineId}/result`, method: "POST", body: { outcome, reference, reason } }),
      invalidatesTags: ["Cycles", "Cycle", "Batch"],
    }),
    // "Record payment": for a failed line where the listener was already paid outside this system --
    // undoes the wallet credit-back and marks it settled so it never resurfaces in a later cycle
    settleFailedLine: builder.mutation({
      query: ({ batchLineId, reference, note }) => ({ url: `/admin/payout/batch-lines/${batchLineId}/settle`, method: "POST", body: { reference, note } }),
      invalidatesTags: ["Cycles", "Cycle", "Lines", "Batch"],
    }),
    addLineAdjustment: builder.mutation({
      query: ({ id, listenerId, amountRs, reason }) => ({ url: `/admin/payout/cycles/${id}/adjustments`, method: "POST", body: { listenerId, amountRs, reason } }),
      invalidatesTags: (r, e, { id }) => ["Cycles", { type: "Cycle", id }, { type: "Lines", id }],
    }),
    holdListener: builder.mutation({
      query: ({ id, listenerId, reason }) => ({ url: `/admin/payout/cycles/${id}/holds/${encodeURIComponent(listenerId)}`, method: "POST", body: { reason } }),
      invalidatesTags: (r, e, { id }) => ["Cycles", { type: "Cycle", id }, { type: "Lines", id }],
    }),
    releaseListener: builder.mutation({
      query: ({ id, listenerId }) => ({ url: `/admin/payout/cycles/${id}/holds/${encodeURIComponent(listenerId)}`, method: "DELETE" }),
      invalidatesTags: (r, e, { id }) => ["Cycles", { type: "Cycle", id }, { type: "Lines", id }],
    }),
    adjustmentCycle: builder.mutation({
      query: (id) => ({ url: `/admin/payout/cycles/${id}/adjustment`, method: "POST", body: {} }),
      invalidatesTags: ["Cycles"],
    }),

    searchListeners: builder.query({ query: (q) => `/admin/payout/listeners/search?q=${encodeURIComponent(q)}` }),
    getPayoutProfile: builder.query({ query: (listenerId) => `/admin/payout/profiles/${encodeURIComponent(listenerId)}`, providesTags: ["Profile"] }),
    savePayoutProfile: builder.mutation({
      query: ({ listenerId, ...body }) => ({ url: `/admin/payout/profiles/${encodeURIComponent(listenerId)}`, method: "PUT", body }),
      invalidatesTags: ["Profile"],
    }),
  }),
});

// The CSV is downloaded with the auth header, then handed to the browser as a file.
export async function downloadCycleFile(id) {
  const res = await fetch(`${baseUrl}/admin/payout/cycles/${id}/file`, { headers: { Authorization: `Bearer ${getCookie("token")}` } });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || `Download failed (${res.status})`);
  const disposition = res.headers.get("Content-Disposition") || "";
  const name = (/filename="([^"]+)"/.exec(disposition) || [])[1] || `payout_cycle_${id}.csv`;
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
  return { name, sha256: res.headers.get("X-File-SHA256") };
}

// A partial (or the final) file, downloaded by its own batch id -- always the exact file behind the row clicked.
export async function downloadBatchFile(cycleId, batchId) {
  const res = await fetch(`${baseUrl}/admin/payout/cycles/${cycleId}/batches/${batchId}/file`, { headers: { Authorization: `Bearer ${getCookie("token")}` } });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || `Download failed (${res.status})`);
  const disposition = res.headers.get("Content-Disposition") || "";
  const name = (/filename="([^"]+)"/.exec(disposition) || [])[1] || `payout_batch_${batchId}.csv`;
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

export const {
  useGetPayoutConfigQuery, useListCyclesQuery, useGetCycleQuery, useGetLinesQuery, useGetLineTxnsQuery, useGetBatchLinesQuery, useGetBatchesQuery, useGetApprovedListenersQuery,
  usePrepareCycleMutation, useApproveCycleMutation, useApproveLineMutation, useGenerateFileMutation, useGeneratePartialFileMutation, useBankResultMutation, useSettleFailedLineMutation, useAdjustmentCycleMutation,
  useGetPayoutProfileQuery, useSavePayoutProfileMutation, useSearchListenersQuery,
  useAddLineAdjustmentMutation, useHoldListenerMutation, useReleaseListenerMutation,
} = payoutApi;
