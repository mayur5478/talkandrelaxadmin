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
        title: "Active User",
        path: "/dashboard/user-management/active-users",
        icon: dropdown,
      },
      {
        title: "Recent User",
        path: "/dashboard/user-management/recent-users",
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
        title: "Listener Application Request List",
        path: "/dashboard/listener-management/listener-application-request",
        icon: dropdown,
      },
      {
        title: "Listeners Profile Approval Requests List",
        path: "/dashboard/listener-management/listeners-profile-approvals",
        icon: dropdown,
      },
    ],
  },

  {
    title: "Payment Management",
    icon: payment,
    type: "dropdown",
    children: [
      {
        title: "Payment List",
        path: "/dashboard/payment-management/payment-list",
        icon: dropdown,
      },
      {
        title: "Salary Payout",
        path: "/dashboard/payment-management/salary-payout",
        icon: dropdown,
      },
      {
        title: "GST List",
        path: "/dashboard/payment-management/Gst-list",
        icon: dropdown,
      },
      {
        title: "Commission List",
        path: "/dashboard/payment-management/commission-list",
        icon: dropdown,
      },
      {
        title: "Revenue Info",
        path: "/dashboard/payment-management/revenue-info",
        icon: dropdown,
      },
    ],
  },
  {
    title: "Recharge and Charges Management",
    path: "/dashboard/recharge-charges",
    icon: recharge,
    type: "dropdown",
    children: [
      {
        title: "Recharge Plan Manage",
        path: "/dashboard/recharge-charges/plans",
        icon: dropdown,
      },
      {
        title: "Gift Amount Manage",
        path: "/dashboard/recharge-charges/gift-manage",
        icon: dropdown,
      },
      {
        title: "Coupen Manage",
        path: "/dashboard/recharge-charges/coupen-manage",
        icon: dropdown,
      },
      {
        title: "Charge Manage",
        path: "/dashboard/recharge-charges/charge-manage",
        icon: dropdown,
      },
      {
        title: "Penalty Manage",
        path: "/dashboard/recharge-charges/penalty-manage",
        icon: dropdown,
      },
    ],
  },
  {
    title: "Contact & Queries Management",
    path: "/dashboard/contact-queries",
    icon: contact,
    type: "dropdown",
    children: [
      {
        title: "Report and Block Manage",
        path: "/dashboard/contact-queries/report-block",
        icon: dropdown,
      },
    ],
  },
  {
    title: "Status",
    path: "/dashboard/status",
    icon: status,
    type: "button",
  },
];
