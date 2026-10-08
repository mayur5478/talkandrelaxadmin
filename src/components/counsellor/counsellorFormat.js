// Pure helpers for the counsellor screens. Tests: counsellorFormat.test.js
// Money arrives as integer PAISE, shares as basis points (6000 = 60%).

export function formatPaise(value) {
  if (value === null || value === undefined || value === "") return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return `₹${(n / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function bpsToPct(bps) {
  if (bps === null || bps === undefined || bps === "") return "—";
  const n = Number(bps);
  if (!Number.isFinite(n)) return "—";
  return `${(n / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}%`;
}

// "499" / "499.50" rupees typed by a human -> integer paise (null when not a valid non-negative amount)
export function rupeesToPaise(text) {
  const t = String(text ?? "").trim();
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return null;
  return Math.round(Number(t) * 100);
}

export function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// "a, b ,c" -> ["a","b","c"]; numbers=true -> [15,30]
export function parseList(text, numbers = false) {
  const parts = String(text ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  return numbers ? parts.map(Number).filter((n) => Number.isFinite(n) && n > 0) : parts;
}

export const CHECK_TYPES = ["qualification", "kyc_bg", "experience", "demo", "training"];
export const CHECK_LABEL = {
  qualification: "Qualification",
  kyc_bg: "KYC & background",
  experience: "Experience",
  demo: "Demo session",
  training: "Training",
};
export const RUBRIC_KEYS = ["empathy", "boundaries", "language"];

export const STATUS_LABEL = {
  applied: "Applied", vetting: "Vetting", training: "Training", live: "Live", inactive: "Inactive", removed: "Removed",
};
export function statusTone(status) {
  if (status === "live") return "success";
  if (status === "vetting" || status === "training") return "warning";
  if (status === "removed") return "danger";
  if (status === "applied") return "info";
  return "neutral";
}

export function checkTone(status) {
  if (status === "passed") return "success";
  if (status === "failed") return "danger";
  return "neutral";
}

export const TIER_TONE = { founding: "info", early: "warning", standard: "neutral" };

export const BOOKING_STATUSES = [
  "confirmed", "in_progress", "completed", "user_no_show", "counsellor_no_show", "both_no_show",
  "tech_failure", "cancelled_user", "cancelled_counsellor",
];
export const bookingLabel = (s) => String(s || "").replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
export function bookingTone(status) {
  if (status === "completed") return "success";
  if (status === "confirmed" || status === "in_progress") return "info";
  if (status === "cancelled_user" || status === "cancelled_counsellor") return "neutral";
  return "danger";
}

export const isNotEnabled = (err) =>
  !!err && err.status === 404 && (!err.data || !err.data.message || err.data.message === "Not found");

// Server message, plus the `missing` list on a CHECKS_INCOMPLETE 422.
export function errorMessage(err, fallback = "Something went wrong") {
  if (isNotEnabled(err)) return "Counsellor module is not enabled on this server";
  const data = (err && err.data) || {};
  let msg = data.message || (err && err.message) || fallback;
  if (Array.isArray(data.missing) && data.missing.length) {
    msg += ` (missing: ${data.missing.map((m) => CHECK_LABEL[m] || m).join(", ")})`;
  }
  return msg;
}
