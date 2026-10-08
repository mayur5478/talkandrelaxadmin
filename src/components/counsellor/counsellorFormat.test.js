import { formatPaise, bpsToPct, rupeesToPaise, errorMessage, isNotEnabled, parseList } from "./counsellorFormat";
import { canAccessPath, filterNavGroups, defaultLandingPath, ROLE_COUNSELLOR_HEAD, ROLE_ADMIN, ROLE_HR } from "../../utils/roles";

test("money and shares", () => {
  expect(formatPaise(49900)).toBe("₹499.00");
  expect(formatPaise(null)).toBe("—");
  expect(bpsToPct(6000)).toBe("60%");
  expect(rupeesToPaise("12.5")).toBe(1250);
  expect(rupeesToPaise("abc")).toBeNull();
  expect(parseList("30, 45,,60", true)).toEqual([30, 45, 60]);
});

test("feature flag off and 422 missing list", () => {
  expect(isNotEnabled({ status: 404, data: { message: "Not found" } })).toBe(true);
  expect(isNotEnabled({ status: 404, data: { message: "Counsellor not found" } })).toBe(false);
  expect(errorMessage({ status: 422, data: { message: "Checks incomplete", code: "CHECKS_INCOMPLETE", missing: ["demo", "kyc_bg"] } })).toBe("Checks incomplete (missing: Demo session, KYC & background)");
});

test("counsellor_head is confined to the counsellors pages except config", () => {
  expect(canAccessPath("/dashboard/counsellors/network", ROLE_COUNSELLOR_HEAD)).toBe(true);
  expect(canAccessPath("/dashboard/counsellors/config", ROLE_COUNSELLOR_HEAD)).toBe(false);
  expect(canAccessPath("/dashboard/analytics", ROLE_COUNSELLOR_HEAD)).toBe(false);
  expect(canAccessPath("/dashboard/counsellors/config", ROLE_ADMIN)).toBe(true);
  expect(canAccessPath("/dashboard/counsellors/config", ROLE_HR)).toBe(false);
  expect(defaultLandingPath(ROLE_COUNSELLOR_HEAD)).toBe("/dashboard/counsellors/applications");
  const groups = [{ label: "Counsellors", items: [{ title: "C", children: [{ title: "N", path: "/dashboard/counsellors/network" }, { title: "Cfg", path: "/dashboard/counsellors/config" }] }] },
    { label: "Main", items: [{ title: "D", path: "/dashboard/analytics" }] }];
  const out = filterNavGroups(groups, ROLE_COUNSELLOR_HEAD);
  expect(out).toHaveLength(1);
  expect(out[0].items[0].children.map((c) => c.title)).toEqual(["N"]);
});
