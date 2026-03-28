import React, { useEffect, useState } from "react";
import "./main.scss";
import Sidebar from "../sidebar/Sidebar";
import Navbars from "../navbars/Navbars";
import { Route, Routes, useNavigate } from "react-router-dom";
import Dashboard from "../dashboard/Dashboard";
import Users from "../user-management/user-list/Users";
import ActiveUsers from "../user-management/active-users/ActiveUsers";
import RecentUsers from "../user-management/recent-users/RecentUsers";
import Listeners from "../listener-management/listeners-list/Listeners";
import ApplicationRequests from "../listener-management/application-requests/ApplicationRequests";
import ProfileApproval from "../listener-management/profile-approvals/ProfileApproval";
import PaymentList from "../payment-management/payment-list/PaymentList";
import SalaryPyout from "../payment-management/salary-payout/SalaryPyout";
import Gst from "../payment-management/gst-list/Gst";
import CommisionLiat from "../payment-management/commision-list/CommisionLiat";
import RevenueInfo from "../payment-management/revenue-info/RevenueInfo";
import Recharge from "../recharge-charges/recharge-plans/Recharge";
import GiftManagement from "../recharge-charges/gift-management/GiftManagement";
import CoupenManagement from "../recharge-charges/coupen-management/CoupenManagement";
import ChargeManagement from "../recharge-charges/charge-management/ChargeManagement";
import ReportBlock from "../contact-quires-manage/report-block/ReportBlock";
import PenaltyManage from "../recharge-charges/penalty-manage/Penaltymanage";
import ListenerProfileView from "../listener-management/listener-profile-view/ListenerProfileView";
import Docs from "../listener-management/docs/Docs";
import UserProfile from "../user-management/user-profile-view/UserProfile";
import ListenerDetailsForm from "../listener-management/listener-detail-form/ListenerDetailsForm";
import EditSalary from "../payment-management/payment-list/edit-salary/EditSalary";
import SalarySlip from "../payment-management/payment-list/salary-slip/SalarySlip";
import { useGetMeQuery } from "../../services/auth";
import { getCookie } from "../../cookie_helper/cookie";
import Status from "../status/Status";
import ServiceHistory from "../analytics/ServiceHistory";
import CallRejections from "../analytics/CallRejections";

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
        <Routes>
          <Route path="/analytics" element={<Dashboard />} />
          <Route path="/user-management/users-list" element={<Users />} />
          <Route path="/user-management/active-users" element={<ActiveUsers />} />
          <Route path="/user-management/recent-users" element={<RecentUsers />} />
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
          <Route path="/recharge-charges/plans" element={<Recharge />} />
          <Route path="/recharge-charges/gift-manage" element={<GiftManagement />} />
          <Route path="/recharge-charges/coupen-manage" element={<CoupenManagement />} />
          <Route path="/recharge-charges/charge-manage" element={<ChargeManagement />} />
          <Route path="/recharge-charges/penalty-manage" element={<PenaltyManage />} />
          <Route path="/service-history" element={<ServiceHistory />} />
          <Route path="/rejections" element={<CallRejections />} />
          <Route path="/status" element={<Status />} />
          <Route path="/contact-queries/report-block" element={<ReportBlock />} />
          <Route path="/listener-management/profile-view" element={<ListenerProfileView />} />
          <Route path="user-management/profile-view" element={<UserProfile />} />
          <Route path="listener-management/profile-form" element={<ListenerDetailsForm />} />
        </Routes>
      </div>
    </div>
  );
};

export default Main;
