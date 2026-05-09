/*
 * Sidebar navigation structure for the v2 admin shell.
 *
 * One-to-one with the legacy src/components/sidebar/sidebarLink.js so all
 * existing routes still resolve. Differences:
 *   - icons are Lucide components (not png imports)
 *   - items are partitioned into two top-level groups ("Main", "Workspace")
 *     that render as sentence-case eyebrows in the sidebar
 *   - badge counts can be supplied at render time via the badge map
 *
 * Every `path` here matches a Route in src/components/main/Main.jsx.
 */

import {
  LayoutDashboard,
  Users,
  Headphones,
  Wallet,
  TrendingUp,
  CalendarDays,
  History,
  XCircle,
  Sliders,
  Sparkles,
  MessageSquareWarning,
  Bell,
} from 'lucide-react';

export const navGroups = [
  {
    label: 'Main',
    items: [
      {
        title: 'Dashboard',
        path: '/dashboard/analytics',
        icon: LayoutDashboard,
      },
      {
        title: 'User management',
        icon: Users,
        children: [
          { title: 'User list',          path: '/dashboard/user-management/users-list' },
          { title: 'Active users',       path: '/dashboard/user-management/active-users' },
          { title: 'Recent users',       path: '/dashboard/user-management/recent-users' },
          { title: 'Soft-deleted users', path: '/dashboard/user-management/soft-deleted-users' },
        ],
      },
      {
        title: 'Listener management',
        icon: Headphones,
        children: [
          { title: 'Listeners',            path: '/dashboard/listener-management/listeners-list' },
          { title: 'Application requests', path: '/dashboard/listener-management/listener-application-request' },
          { title: 'Profile approvals',    path: '/dashboard/listener-management/listeners-profile-approvals' },
        ],
      },
      {
        title: 'Financial management',
        icon: Wallet,
        children: [
          { title: 'Recharges & gifts',   path: '/dashboard/payment-management/payment-list' },
          { title: 'Salary payouts',      path: '/dashboard/payment-management/salary-payout' },
          { title: 'GST records',         path: '/dashboard/payment-management/Gst-list' },
          { title: 'Commission info',     path: '/dashboard/payment-management/commission-list' },
          { title: 'Revenue overview',    path: '/dashboard/payment-management/revenue-info' },
          { title: 'Manual recharges',    path: '/dashboard/payment-management/manual-recharges' },
          { title: 'Wallet ledger',       path: '/dashboard/payment-management/wallet-ledger' },
        ],
      },
      {
        title: 'Business insights',
        icon: TrendingUp,
        path: '/dashboard/business-insights',
      },
    ],
  },
  {
    label: 'Workspace',
    items: [
      { title: 'Daily summary',  path: '/dashboard/daily-summary',   icon: CalendarDays },
      { title: 'Service history', path: '/dashboard/service-history', icon: History },
      { title: 'Call rejections', path: '/dashboard/rejections',      icon: XCircle },
      {
        title: 'Platform controls',
        icon: Sliders,
        children: [
          { title: 'Recharge plans',   path: '/dashboard/recharge-charges/plans' },
          { title: 'Gift management',  path: '/dashboard/recharge-charges/gift-manage' },
          { title: 'Coupon management', path: '/dashboard/recharge-charges/coupen-manage' },
          { title: 'Charge ratio',     path: '/dashboard/recharge-charges/charge-manage' },
          { title: 'Penalty logs',     path: '/dashboard/recharge-charges/penalty-manage' },
        ],
      },
      { title: 'Status & stories',  path: '/dashboard/status',                       icon: Sparkles },
      { title: 'Report & Block',     path: '/dashboard/contact-queries/report-block', icon: MessageSquareWarning },
      { title: 'Push notifications', path: '/dashboard/push-notifications',          icon: Bell },
    ],
  },
];

/**
 * Flatten the nav into a single array of {title, path} pairs for the
 * command palette and breadcrumb resolver.
 */
export function flattenNav() {
  const out = [];
  for (const g of navGroups) {
    for (const it of g.items) {
      if (it.path) out.push({ title: it.title, path: it.path });
      if (it.children) for (const c of it.children) out.push({ title: c.title, path: c.path });
    }
  }
  return out;
}

/**
 * Resolve a router pathname into a breadcrumb trail like
 *   ['Listener management', 'Application requests']
 * Falls back to a humanized split of the URL if no nav match is found.
 */
export function resolveBreadcrumb(pathname) {
  for (const g of navGroups) {
    for (const it of g.items) {
      if (it.path === pathname) return [it.title];
      if (it.children) {
        const child = it.children.find((c) => c.path === pathname);
        if (child) return [it.title, child.title];
      }
    }
  }
  // Last-resort humanization
  const tail = pathname.split('/').filter(Boolean).pop() || 'Overview';
  return [tail.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())];
}
