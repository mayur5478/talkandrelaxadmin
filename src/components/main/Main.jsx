import React, { lazy, Suspense, useEffect, useState } from "react";
import "./main.scss";
import Sidebar from "../sidebar/Sidebar";
import Navbars from "../navbars/Navbars";
import { Route, Routes, useNavigate } from "react-router-dom";
import { useGetMeQuery } from "../../services/auth";
import { getCookie } from "../../cookie_helper/cookie";

// Lazy-load all route components — each becomes its own JS chunk
// loaded only when the user navigates to that route.
const Dashboard           = lazy(() => import("../dashboard/Dashboard"));
const Users               = lazy(() => import("../user-management/user-list/Users"));
const ActiveUsers         = lazy(() => import("../user-management/active-users/ActiveUsers"));
const RecentUsers         = lazy(() => import("../user-management/recent-users/RecentUsers"));
const SoftDeletedUsers    = lazy(() => import("../user-management/soft-deleted-users/SoftDeletedUsers"));
const Listeners           = lazy(() => import("../listener-management/listeners-list/Listeners"));
const ApplicationRequests = lazy(() => import("../listener-management/application-requests/ApplicationRequests"));
const ProfileApproval     = lazy(() => import("../listener-management/profile-approvals/ProfileApproval"));
const Docs                = lazy(() => import("../listener-management/docs/Docs"));
const ListenerProfileView = lazy(() => import("../listener-management/listener-profile-view/ListenerProfileView"));
const ListenerDetailsForm = lazy(() => import("../listener-management/listener-detail-form/ListenerDetailsForm"));
const PaymentList         = lazy(() => import("../payment-management/payment-list/PaymentList"));
const EditSalary          = lazy(() => import("../payment-management/payment-list/edit-salary/EditSalary"));
const SalarySlip          = lazy(() => import("../payment-management/payment-list/salary-slip/SalarySlip"));
const SalaryPyout         = lazy(() => import("../payment-management/salary-payout/SalaryPyout"));
const Gst                 = lazy(() => import("../payment-management/gst-list/Gst"));
const CommisionLiat       = lazy(() => import("../payment-management/commision-list/CommisionLiat"));
const RevenueInfo         = lazy(() => import("../payment-management/revenue-info/RevenueInfo"));
const ManualRecharges     = lazy(() => import("../payment-management/manual-recharges/ManualRecharges"));
const Recharge            = lazy(() => import("../recharge-charges/recharge-plans/Recharge"));
const GiftManagement      = lazy(() => import("../recharge-charges/gift-management/GiftManagement"));
const CoupenManagement    = lazy(() => import("../recharge-charges/coupen-management/CoupenManagement"));
const ChargeManagement    = lazy(() => import("../recharge-charges/charge-management/ChargeManagement"));
const PenaltyManage       = lazy(() => import("../recharge-charges/penalty-manage/Penaltymanage"));
const ReportBlock         = lazy(() => import("../contact-quires-manage/report-block/ReportBlock"));
const BusinessInsights    = lazy(() => import("../business-insights/BusinessInsights"));
const ServiceHistory      = lazy(() => import("../analytics/ServiceHistory"));
const CallRejections      = lazy(() => import("../analytics/CallRejections"));
const Status              = lazy(() => import("../status/Status"));
const UserProfile         = lazy(() => import("../user-management/user-profile-view/UserProfile"));

const Main = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };
  const {
    data: user,
    isLoading: isUserLoading,
    error: userError,
  } = useGetMeQuery(null, {
    skip: !getCookie("token") && !localStorage.getItem("token"),
  });

  const navigate = useNavigate();
  useEffect(() => {
    if (!user && !isUserLoading && userError) {
      navigate("/");
    }
  }, [user, navigate, isUserLoading, userError]);

  return (
    <div className={`main-section ${!isSidebarOpen ? "menu-closed" : ""}`}>
      <Sidebar isSidebarOpen={isSidebarOpen} closeSidebar={closeSidebar} />
      <div id="main" className="main">
        <Navbars toggleSidebar={toggleSidebar} />
        <Suspense fallback={<div style={{padding:'2rem',textAlign:'center'}}>Loading...</div>}>
        <Routes>
          <Route path="/analytics" element={<Dashboard />} />
          <Route path="/user-management/users-list" element={<Users />} />
          <Route path="/user-management/active-users" element={<ActiveUsers />} />
          <Route path="/user-management/recent-users" element={<RecentUsers />} />
          <Route path="/user-management/soft-deleted-users" element={<SoftDeletedUsers />} />
          <Route path="/listener-management/listeners-list" element={<Listeners />} />
          <Route path="/listener-management/listener-application-request" element={<ApplicationRequests />} />
          <Route path="/listener-management/listeners-profile-approvals" element={<ProfileApproval />} />
          <Route path="/listener-management/listeners-profile-approvals-docs" element={<Docs />} />
          <Route path="/payment-management/payment-list" element={<PaymentList />} />
          <Route path="/payment-management/edit-salary" element={<EditSalary />} />
          <Route path="/payment-management/salary-slip" element={<SalarySlip />} />
          <Route path="/payment-management/salary-payout" element={<SalaryPyout />} />
          <Route path="/payment-management/Gst-list" element={<Gst />} />
          <Route path="/payment-management/commission-list" element={<CommisionLiat />} />
          <Route path="/payment-management/revenue-info" element={<RevenueInfo />} />
          <Route path="/payment-management/manual-recharges" element={<ManualRecharges />} />
          <Route path="/recharge-charges/plans" element={<Recharge />} />
          <Route path="/recharge-charges/gift-manage" element={<GiftManagement />} />
          <Route path="/recharge-charges/coupen-manage" element={<CoupenManagement />} />
          <Route path="/recharge-charges/charge-manage" element={<ChargeManagement />} />
          <Route path="/recharge-charges/penalty-manage" element={<PenaltyManage />} />
          <Route path="/business-insights" element={<BusinessInsights />} />
          <Route path="/service-history" element={<ServiceHistory />} />
          <Route path="/rejections" element={<CallRejections />} />
          <Route path="/status" element={<Status />} />
          <Route path="/contact-queries/report-block" element={<ReportBlock />} />
          <Route path="/listener-management/profile-view" element={<ListenerProfileView />} />
          <Route path="user-management/profile-view" element={<UserProfile />} />
          <Route path="listener-management/profile-form" element={<ListenerDetailsForm />} />
        </Routes>
        </Suspense>
      </div>
    </div>
  );
};

export default Main;
