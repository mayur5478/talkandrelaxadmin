import { formatRs, statusTone, nextActions, windowLabel, errorMessage, holdLabel } from "./payoutFormat";

test("formatRs groups the Indian way and never invents a value", () => {
  expect(formatRs("1234.5")).toBe("₹1,234.50");
  expect(formatRs("1234567.89")).toBe("₹12,34,567.89");
  expect(formatRs("0.00")).toBe("₹0.00");
  expect(formatRs("-300.00")).toBe("₹-300.00");
  expect(formatRs(null)).toBe("—");
  expect(formatRs("abc")).toBe("—");
});

test("status drives the tone and the next actions", () => {
  expect(statusTone("pending_approval")).toBe("warning");
  expect(statusTone("paid")).toBe("success");
  expect(nextActions("pending_approval")).toEqual(["recompute", "approve"]);
  expect(nextActions("approved")).toEqual(["generateFile", "adjust"]);
  expect(nextActions("file_generated")).toContain("recordResults");
  expect(nextActions("open")).toEqual([]);
  // an approved cycle can never be recomputed from the UI
  for (const s of ["approved", "file_generated", "paid", "reconciled"]) expect(nextActions(s)).not.toContain("recompute");
});

test("window label shows the last day, not the exclusive end", () => {
  const ist = (s) => Date.parse(`${s}+05:30`);
  expect(windowLabel(ist("2026-08-26T00:00:00"), ist("2026-09-26T00:00:00"))).toBe("2026-08-26 to 2026-09-25");
  expect(windowLabel(NaN, 1)).toBe("—");
});

test("error messages: server text wins, a bare 404 means the feature is off", () => {
  expect(errorMessage({ status: 403, data: { message: "maker-checker: the approver must be a different person than the preparer" } })).toMatch(/maker-checker/);
  expect(errorMessage({ status: 404, data: { message: "Not found" } })).toBe("NOT_ENABLED");
  expect(errorMessage({ status: 404, data: { message: "cycle not found" } })).toBe("cycle not found");
  expect(errorMessage(null, "fallback")).toBe("fallback");
});

test("hold reasons are readable", () => {
  expect(holdLabel("NO_BANK_DETAILS")).toMatch(/bank/i);
  expect(holdLabel("SOMETHING_NEW")).toBe("SOMETHING_NEW");
});
