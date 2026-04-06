import dashboard from "../assets/Union.png";
import users from "../assets/users.png";
import listeners from "../assets/listener.png";
import payment from "../assets/payment.png";
import recharge from "../assets/recharge.png";
import contact from "../assets/user-setting.png";
import status from "../assets/status.png";
import dropdown from "../assets/dropdown.png";

export const links = [
  {
    title: "Dashboard",
    path: "/dashboard/analytics",
    icon: dashboard,
    type: "button",
  },
  {
    title: "User Management",
    icon: users,
    type: "dropdown",
    children: [
      {
        title: "User List",
        path: "/dashboard/user-management/users-list",
        icon: dropdown,
      },
      {
        title: "Active Users",
        path: "/dashboard/user-management/active-users",
        icon: dropdown,
      },
      {
        title: "Recent Users",
        path: "/dashboard/user-management/recent-users",
        icon: dropdown,
      },
      {
        title: "Soft Deleted Users",
        path: "/dashboard/user-management/soft-deleted-users",
        icon: dropdown,
      },
    ],
  },
  {
    title: "Listener Management",
    icon: listeners,
    type: "dropdown",
    children: [
      {
        title: "Listeners",
        path: "/dashboard/listener-management/listeners-list",
        icon: dropdown,
      },
      {
        title: "Application Requests",
        path: "/dashboard/listener-management/listener-application-request",
        icon: dropdown,
      },
      {
        title: "Profile Approvals",
        path: "/dashboard/listener-management/listeners-profile-approvals",
        icon: dropdown,
      },
    ],
  },
  {
    title: "Financial Management",
    icon: payment,
    type: "dropdown",
    children: [
      {
        title: "Recharges & Gifts",
        path: "/dashboard/payment-management/payment-list",
        icon: dropdown,
      },
      {
        title: "Salary Payouts",
        path: "/dashboard/payment-management/salary-payout",
        icon: dropdown,
      },
      {
        title: "GST Records",
        path: "/dashboard/payment-management/Gst-list",
        icon: dropdown,
      },
      {
        title: "Commission Info",
        path: "/dashboard/payment-management/commission-list",
        icon: dropdown,
      },
      {
        title: "Revenue Overview",
        path: "/dashboard/payment-management/revenue-info",
        icon: dropdown,
      },
      {
        title: "Manual Recharges",
        path: "/dashboard/payment-management/manual-recharges",
        icon: dropdown,
      },
    ],
  },
  {
    title: "Service History",
    icon: recharge,
    path: "/dashboard/service-history",
    type: "button",
  },
  {
    title: "Call Rejections",
    icon: status,
    path: "/dashboard/rejections",
    type: "button",
  },
  {
    title: "Platform Controls",
    icon: recharge,
    type: "dropdown",
    children: [
      {
        title: "Recharge Plans",
        path: "/dashboard/recharge-charges/plans",
        icon: dropdown,
      },
      {
        title: "Gift Management",
        path: "/dashboard/recharge-charges/gift-manage",
        icon: dropdown,
      },
      {
        title: "Coupon Management",
        path: "/dashboard/recharge-charges/coupen-manage",
        icon: dropdown,
      },
      {
        title: "Charge Ratio",
        path: "/dashboard/recharge-charges/charge-manage",
        icon: dropdown,
      },
      {
        title: "Penalty Logs",
        path: "/dashboard/recharge-charges/penalty-manage",
        icon: dropdown,
      },
    ],
  },
  {
    title: "Status & Stories",
    path: "/dashboard/status",
    icon: status,
    type: "button",
  },
  {
    title: "Support Queries",
    path: "/dashboard/contact-queries/report-block",
    icon: contact,
    type: "button",
  },
];
