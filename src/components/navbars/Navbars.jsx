import React, { useState } from "react";
import { Navbar, Nav, Container, Dropdown } from "react-bootstrap";
import "./navbar.scss";
import drawer from "../assets/drawer.png";
import userPlus from "../assets/userplus.png";
import mailbox from "../assets/mailbox.png";
import notification from "../assets/notification.png";
import avatar from "../assets/dummy.png";
import downArrow from "../assets/bottom-arrow.png";
import { useLocation } from "react-router-dom";
import {
  useGetMeQuery,
  useLogoutAdminMutation,
  useResetAdminPasswordMutation,
} from "../../services/auth";
import { getCookie, clearCookie } from "../../cookie_helper/cookie";
import ResetPassword from "../common/reset-password/ResetPassword";
function Navbars({ toggleSidebar }) {
  const location = useLocation();
  const {
    data: user,
    refetch,
    isLoading: isUserLoading,
    error: userError,
  } = useGetMeQuery(null, {
    skip: !getCookie("token") && !localStorage.getItem("token"),
  });
  console.log("user", user);
  const [showResetModal, setShowResetModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetAdminPassword, { isError: error }] =
    useResetAdminPasswordMutation();
  const [logoutAdmin] = useLogoutAdminMutation();

  const handleResetPasswordSubmit = async (newPassword, oldPassword) => {
    setIsSubmitting(true);
    try {
      const adminId = user?.user?.id;
      await resetAdminPassword({
        adminId,
        newPassword,
        oldPassword,
      }).unwrap();
      setShowResetModal(false);
      handleLogout();
    } catch (error) {
      if (error.status == 401) {
        alert("Old password is incorrect");
      } else {
        console.error("Reset password error:", error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      const adminId = user?.user?.id;
      await logoutAdmin({ adminId }).unwrap();
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      clearCookie("token");
      clearCookie("role");
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
      alert("Logout failed");
    }
  };
  return (
    <div className="navbar-main">
      <Navbar bg="light" data-bs-theme="light">
        <Container>
          <Navbar.Brand href="#home">
            <img src={drawer} alt={drawer} onClick={toggleSidebar} />
            <p>Dashboard</p>
          </Navbar.Brand>

          <Nav className="right-section">
            {/* <img src={userPlus} alt={userPlus} />
            <img src={mailbox} alt={mailbox} /> */}
            {/* <img src={notification} alt={notification} /> */}
            <Dropdown>
              <Dropdown.Toggle id="dropdown-basic">
                <div className="avatar">
                  <div className="user-profile">
                    {" "}
                    <img
                      className="avatar-image"
                      src={avatar}
                      alt={avatar}
                    />{" "}
                    <div className="user-name">
                      {" "}
                      <p className="name">
                        {user?.user?.first_name} {user?.user?.last_name}
                      </p>{" "}
                      <p className="role">
                        {user?.user?.role?.charAt(0).toUpperCase() +
                          user?.user?.role?.slice(1).toLowerCase()}
                      </p>
                    </div>
                  </div>
                  <img
                    className="down-arrow-img"
                    src={downArrow}
                    alt={downArrow}
                  />
                </div>
              </Dropdown.Toggle>

              <Dropdown.Menu>
                <div className="option" onClick={() => setShowResetModal(true)}>
                  Reset Password
                </div>
                <div className="option" onClick={handleLogout}>
                  Logout
                </div>
              </Dropdown.Menu>
            </Dropdown>
          </Nav>
        </Container>
      </Navbar>
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
