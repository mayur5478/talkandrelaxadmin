import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getCookie } from "../cookie_helper/cookie";

// Company staff salary admin API (backend routes/admin/salary/salary.js). Roles: admin, hr, finance.
// Fixed monthly salary for staff -- separate from listener payouts (services/payout.js). Every route
// answers 404 until SALARY_ADMIN_ENABLED=true on the server.
const baseUrl = process.env.REACT_APP_SERVER_URL;

export const salaryApi = createApi({
  reducerPath: "salaryApi",
  baseQuery: fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers) => {
      const token = getCookie("token");
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["Employees", "Cycles", "CycleLines"],
  endpoints: (builder) => ({
    listEmployees: builder.query({
      query: ({ q, status } = {}) => {
        const params = new URLSearchParams();
        if (q) params.set("q", q);
        if (status) params.set("status", status);
        const qs = params.toString();
        return `/admin/salary/employees${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["Employees"],
    }),
    createEmployee: builder.mutation({
      query: (body) => ({ url: "/admin/salary/employees", method: "POST", body }),
      invalidatesTags: ["Employees"],
    }),
    updateEmployee: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/admin/salary/employees/${id}`, method: "PUT", body }),
      invalidatesTags: ["Employees"],
    }),

    listCycles: builder.query({ query: () => "/admin/salary/cycles", providesTags: ["Cycles"] }),
    prepareCycle: builder.mutation({
      query: (body) => ({ url: "/admin/salary/cycles", method: "POST", body }),
      invalidatesTags: ["Cycles"],
    }),
    getCycleLines: builder.query({
      query: (id) => `/admin/salary/cycles/${id}/lines`,
      providesTags: (r, e, id) => [{ type: "CycleLines", id }],
    }),
    setLineAdjustment: builder.mutation({
      query: ({ lineId, ...body }) => ({ url: `/admin/salary/lines/${lineId}/adjustment`, method: "PUT", body }),
      invalidatesTags: (r, e, { cycleId }) => [{ type: "CycleLines", id: cycleId }],
    }),
    payLine: builder.mutation({
      query: ({ lineId, ...body }) => ({ url: `/admin/salary/lines/${lineId}/pay`, method: "POST", body }),
      invalidatesTags: (r, e, { cycleId }) => [{ type: "CycleLines", id: cycleId }],
    }),
    finalizeCycle: builder.mutation({
      query: (id) => ({ url: `/admin/salary/cycles/${id}/finalize`, method: "POST" }),
      invalidatesTags: ["Cycles"],
    }),
  }),
});

// A single employee's slip for a cycle, downloaded with the auth header and handed to the browser as a file.
export async function downloadSlip(lineId, fileNameHint) {
  const res = await fetch(`${baseUrl}/admin/salary/lines/${lineId}/slip`, { headers: { Authorization: `Bearer ${getCookie("token")}` } });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || `Download failed (${res.status})`);
  const disposition = res.headers.get("Content-Disposition") || "";
  const name = (/filename="([^"]+)"/.exec(disposition) || [])[1] || fileNameHint || `salary_slip_${lineId}.pdf`;
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

// Every employee's slip for a cycle, one page each, as a single combined PDF.
export async function downloadCycleSlips(cycleId, fileNameHint) {
  const res = await fetch(`${baseUrl}/admin/salary/cycles/${cycleId}/slips`, { headers: { Authorization: `Bearer ${getCookie("token")}` } });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || `Download failed (${res.status})`);
  const disposition = res.headers.get("Content-Disposition") || "";
  const name = (/filename="([^"]+)"/.exec(disposition) || [])[1] || fileNameHint || `salary_slips_${cycleId}.pdf`;
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

export const {
  useListEmployeesQuery, useCreateEmployeeMutation, useUpdateEmployeeMutation,
  useListCyclesQuery, usePrepareCycleMutation, useGetCycleLinesQuery,
  useSetLineAdjustmentMutation, usePayLineMutation, useFinalizeCycleMutation,
} = salaryApi;
