import { canAccessPath, filterNavGroups, ROLE_FINANCE, ROLE_HR, ROLE_ADMIN } from "./roles";

const groups = [
  { label: "Main", items: [
    { title: "Dashboard", path: "/dashboard/analytics" },
    { title: "Payouts", path: "/dashboard/payout" },
    { title: "Users", children: [{ title: "List", path: "/dashboard/user-management/users-list" }] },
  ] },
];

test("finance reaches the payout pages and nothing else", () => {
  for (const p of ["/dashboard/payout", "/dashboard/payout/cycle/12", "/dashboard/payout/profiles"]) expect(canAccessPath(p, ROLE_FINANCE)).toBe(true);
  for (const p of ["/dashboard/analytics", "/dashboard/payment-management/salary-payout", "/dashboard/listener-management/listeners-list", "/dashboard/system-reset"]) expect(canAccessPath(p, ROLE_FINANCE)).toBe(false);
});

test("finance sidebar shows only Payouts", () => {
  const out = filterNavGroups(groups, ROLE_FINANCE);
  expect(out).toHaveLength(1);
  expect(out[0].items.map((i) => i.title)).toEqual(["Payouts"]);
});

test("admin still sees everything and HR still cannot open payouts", () => {
  expect(filterNavGroups(groups, ROLE_ADMIN)).toBe(groups);
  expect(canAccessPath("/dashboard/payout", ROLE_ADMIN)).toBe(true);
  expect(canAccessPath("/dashboard/payout", ROLE_HR)).toBe(false);
});
