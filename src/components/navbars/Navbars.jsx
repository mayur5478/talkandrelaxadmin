import React, { useState } from "react";
import "./navbar.scss";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import { Dropdown } from "react-bootstrap";
import drawer from "../assets/drawer.png";
import avatar from "../assets/dummy.png";
import {
  useGetMeQuery,
  useLogoutAdminMutation,
  useResetAdminPasswordMutation,
} from "../../services/auth";
import { getCookie, clearCookie } from "../../cookie_helper/cookie";
import ResetPassword from "../common/reset-password/ResetPassword";

function Navbars({ toggleSidebar }) {
  const location = useLocation();
  const { data: user } = useGetMeQuery(null, {
    skip: !getCookie("token") && !localStorage.getItem("token"),
  });

  const [showResetModal, setShowResetModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetAdminPassword, { isError: error }] = useResetAdminPasswordMutation();
  const [logoutAdmin] = useLogoutAdminMutation();

  const handleResetPasswordSubmit = async (newPassword, oldPassword) => {
    setIsSubmitting(true);
    try {
      await resetAdminPassword({
        adminId: user?.user?.id,
        newPassword,
        oldPassword,
      }).unwrap();
      setShowResetModal(false);
      handleLogout();
    } catch (err) {
      if (err.status === 401) alert("Old password is incorrect");
      else console.error("Reset password error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutAdmin({ adminId: user?.user?.id }).unwrap();
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      clearCookie("token");
      clearCookie("role");
      window.location.href = "/";
    } catch (err) {
      console.error("Logout error:", err);
      alert("Logout failed");
    }
  };

  // Build readable page title from URL
  const segments = location.pathname.split("/").filter(Boolean);
  const rawTitle = segments[segments.length - 1] || "dashboard";
  const pageTitle = rawTitle
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const initials =
    `${user?.user?.first_name?.[0] || ""}${user?.user?.last_name?.[0] || ""}`.toUpperCase() || "AD";

  return (
    <div className="topnav">
      <div className="topnav__inner">
        {/* ── Left ── */}
        <div className="topnav__left">
          <motion.button
            className="topnav__menu-btn"
            onClick={toggleSidebar}
            whileHover={{ scale: 1.06, backgroundColor: "#e2e8f0" }}
            whileTap={{ scale: 0.93 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <img src={drawer} alt="menu" />
          </motion.button>

          <div className="topnav__breadcrumb">
            <span className="bc-root">Admin</span>
            <span className="bc-sep">/</span>
            <span className="bc-current">{pageTitle}</span>
          </div>
        </div>

        {/* ── Right ── */}
        <div className="topnav__right">
          {/* Live badge */}
          <div className="topnav__live-badge">
            <span className="live-dot" />
            <span>Live</span>
          </div>

          {/* User menu */}
          <Dropdown align="end">
            <Dropdown.Toggle as="div" bsPrefix="custom-toggle">
              <motion.div
                className="topnav__user"
                whileHover={{ backgroundColor: "#f1f5f9" }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.15 }}
              >
                <div className="user-avatar-ring">
                  <img src={avatar} alt="avatar" className="user-avatar-img" />
                </div>
                <div className="user-text d-none d-md-block">
                  <p className="user-name">
                    {user?.user?.first_name} {user?.user?.last_name}
                  </p>
                  <p className="user-role">
                    {user?.user?.role
                      ? user.user.role.charAt(0).toUpperCase() +
                        user.user.role.slice(1).toLowerCase()
                      : "Admin"}
                  </p>
                </div>
                <span className="user-chevron">▾</span>
              </motion.div>
            </Dropdown.Toggle>

            <Dropdown.Menu className="topnav__dropdown">
              <div className="dropdown-header">
                <div className="dh-avatar">{initials}</div>
                <div>
                  <p className="dh-name">
                    {user?.user?.first_name} {user?.user?.last_name}
                  </p>
                  <p className="dh-role">{user?.user?.role || "Administrator"}</p>
                </div>
              </div>
              <div className="dropdown-divider" />
              <motion.div
                className="dropdown-item-custom"
                whileHover={{ x: 4, backgroundColor: "#f8fafc" }}
                onClick={() => setShowResetModal(true)}
              >
                <span className="di-icon">🔑</span>
                Reset Password
              </motion.div>
              <motion.div
                className="dropdown-item-custom dropdown-item-danger"
                whileHover={{ x: 4, backgroundColor: "#fff5f5" }}
                onClick={handleLogout}
              >
                <span className="di-icon">↩</span>
                Logout
              </motion.div>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </div>

      <ResetPassword
        show={showResetModal}
        close={setShowResetModal}
        onHide={() => setShowResetModal(false)}
        onSubmit={handleResetPasswordSubmit}
        isSubmitting={isSubmitting}
        FormError={error}
      />
    </div>
  );
}

export default Navbars;
