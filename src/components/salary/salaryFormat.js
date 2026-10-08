// Pure helpers for the staff salary screens. Amounts arrive as exact rupee strings, formatted only here.

export function formatRs(value) {
  if (value === null || value === undefined || value === "") return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const monthLabel = (month, year) => `${MONTH_NAMES[month - 1]} ${year}`;

export function errorMessage(err, fallback = "Something went wrong") {
  if (err && err.status === 404 && !(err.data && err.data.message && err.data.message !== "Not found")) return "NOT_ENABLED";
  return (err && err.data && err.data.message) || (err && err.message) || fallback;
}
