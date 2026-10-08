// Pure helpers for the payout screens. Tests: payoutFormat.test.js
// Amounts arrive from the API as exact rupee strings ("1234.50"); they are only formatted here, never added up.

export function formatRs(value) {
  if (value === null || value === undefined || value === "") return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export const STATUS_LABEL = {
  open: "Open", computing: "Computing", pending_approval: "Waiting for approval", approved: "Approved",
  file_generated: "Bank file ready", paid: "Paid", reconciled: "Reconciled",
};

export function statusTone(status) {
  if (status === "paid" || status === "reconciled") return "success";
  if (status === "approved" || status === "file_generated") return "info";
  if (status === "pending_approval") return "warning";
  return "neutral";
}

export const HOLD_LABEL = {
  NO_BANK_DETAILS: "No bank details on file",
  NON_POSITIVE_NET: "Nothing to pay (net is zero or negative)",
  MANUAL_HOLD: "Held by you",
};
export const holdLabel = (code) => HOLD_LABEL[code] || code;

// What the person on this screen can do next, from the cycle status alone.
export function nextActions(status) {
  switch (status) {
    case "pending_approval": return ["recompute", "approve"];
    case "approved": return ["generateFile", "adjust"];
    case "file_generated": return ["download", "recordResults", "adjust"];
    case "paid":
    case "reconciled": return ["download", "adjust"];
    default: return [];
  }
}

// "2026-08-26" .. "2026-09-25" as the IST calendar days a window covers (end is exclusive at 00:00 IST)
export function windowLabel(startMs, endMs) {
  const fmt = (ms) => new Date(ms + 330 * 60000).toISOString().slice(0, 10);
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return "—";
  return `${fmt(startMs)} to ${fmt(endMs - 1)}`;
}

export function errorMessage(err, fallback = "Something went wrong") {
  if (err && err.status === 404 && !(err.data && err.data.message && err.data.message !== "Not found")) return "NOT_ENABLED";
  return (err && err.data && err.data.message) || (err && err.message) || fallback;
}
