/*
 * Admin panel role scoping.
 *
 * This is the UI MIRROR of the real access control, which is enforced on the
 * backend by middlewares/auth/secure.js. There, allowedRoles is honoured
 * literally and the default is DENY: a route declared secure(["admin"])
 * rejects an "hr" token with 403. HR only reaches endpoints explicitly
 * declared secure(["admin", "hr"]).
 *
 * So this file exists to keep HR from being shown doors that would 403 — it is
 * not the thing standing between HR and a salary payout. If you widen HR access
 * here, you MUST widen it on the matching backend route too, or the page will
 * render and then fail on every request.
 *
 * Endpoints granted to HR today (keep in sync):
 *   user/user-list, user/user-profile, user/form-data
 *   listener/listener-list, listeners-list, listener-profile/:id,
 *   listener-applications, listener-profiles, listener-request-approval,
 *   reject-request, send-onboarding-form-1, send-onboarding-form-2,
 *   listener-profile-form-link
 *   admin/monthly-insights
 * Deliberately NOT granted: refunds, recharges, payouts/pay-salary, wallet,
 * GST, coupons, plans, admin management.
 */

export const ROLE_ADMIN = 'admin';
export const ROLE_HR = 'hr';

/** Read the role captured at login (Login.jsx stores it in localStorage). */
export function getRole() {
  try {
    return (localStorage.getItem('role') || ROLE_ADMIN).toLowerCase();
  } catch (_) {
    return ROLE_ADMIN;
  }
}

export function isHR() {
  return getRole() === ROLE_HR;
}

/*
 * Route prefixes an HR user may open. Anything not matched here is hidden in
 * the sidebar and blocked by RoleRoute.
 *
 * Per the HR brief:
 *   - complete listener management (listeners, application requests,
 *     profile approvals) — but NOT money refunds
 *   - business insights: payroll (listener online hours, daily call time,
 *     penalty) and listener business
 *   - user list — restricted to candidates who have been sent a form
 */
export const HR_ALLOWED_PREFIXES = [
  '/dashboard/user-management/users-list',
  // Candidate detail — reachable from the "View" action on the user list, and
  // backed by user/user-profile which HR is granted. Without this the View
  // button would bounce them straight back.
  '/dashboard/user-management/profile-view',
  '/dashboard/listener-management',
  '/dashboard/business-insights',
  // Status & stories — HR moderates listener status posts.
  '/dashboard/status',
];

/**
 * Paths an HR user must never reach, even when nested under an allowed
 * prefix. Checked before the allow list.
 */
export const HR_DENIED_PREFIXES = [
  '/dashboard/payment-management',
  '/dashboard/recharge-charges',
];

export function canAccessPath(pathname, role = getRole()) {
  if (role !== ROLE_HR) return true;
  if (HR_DENIED_PREFIXES.some((p) => pathname.startsWith(p))) return false;
  return HR_ALLOWED_PREFIXES.some((p) => pathname.startsWith(p));
}

/**
 * Filter the sidebar groups for the active role. Drops child items the role
 * cannot reach, then drops any parent left with no children.
 */
export function filterNavGroups(groups, role = getRole()) {
  if (role !== ROLE_HR) return groups;

  return groups
    .map((group) => {
      const items = group.items
        .map((item) => {
          if (item.children) {
            const children = item.children.filter((c) => canAccessPath(c.path, role));
            return children.length ? { ...item, children } : null;
          }
          return item.path && canAccessPath(item.path, role) ? item : null;
        })
        .filter(Boolean);
      return items.length ? { ...group, items } : null;
    })
    .filter(Boolean);
}
