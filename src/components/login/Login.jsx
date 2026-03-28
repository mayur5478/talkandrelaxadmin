import React, { useEffect, useState } from "react";
import "./login.scss";
import { Button, Col, Form, Row } from "react-bootstrap";
import loginImage from "../assets/login.png";
import passwordImage from "../assets/pass.png";
import emailImage from "../assets/email.png";
import { useGetMeQuery, useLoginMutation } from "../../services/auth";
import { useNavigate } from "react-router-dom";
import { setCookie, getCookie } from "../../cookie_helper/cookie";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [login, { isLoading, error }] = useLoginMutation();
  const navigate = useNavigate();

  const {
    data: user,
    refetch,
  } = useGetMeQuery(null, {
    skip: !getCookie("token") && !localStorage.getItem("token"),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      const response = await login({ email, password }).unwrap();
      localStorage.setItem("token", response.token);
      localStorage.setItem("role", response.admin.role);
      setCookie("token", response.token, 1);
      setCookie("role", response.admin.role, 1);
      refetch();
      navigate("/dashboard/analytics");
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  useEffect(() => {
    if (user) {
      navigate("/dashboard/analytics");
    }
  }, [user, navigate]);

  return (
    <div className="login-main">
      <Row className="row-class min-vh-100 g-0">
        <Col sm={12} md={6} lg={7} className="login-column d-none d-md-block position-relative">
          <img className="login-img" src={loginImage} alt="background" />
          <div className="welcome-overlay">
             <div className="welcome-content">
                <h1 className="welcome-title">Welcome Back</h1>
                <p className="welcome-text">
                  To keep connected with us please login with your personal info
                </p>
             </div>
          </div>
        </Col>
        <Col sm={12} md={6} lg={5} className="login-column">
          <div className="form-section">
            <div className="form-container">
              <h1 className="title">Login</h1>
              <p className="sub-title text-muted mb-4">Secure Administrator Access</p>
              
              <Form onSubmit={handleSubmit} className="custom-form">
                <div className="form-group-custom mb-3">
                  <img className="input-img" src={emailImage} alt="email" />
                  <Form.Control
                    type="email"
                    placeholder="Enter email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="form-control-lg border-0 shadow-sm"
                  />
                </div>

                <div className="form-group-custom mb-4">
                  <img className="input-img" src={passwordImage} alt="password" />
                  <Form.Control
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="form-control-lg border-0 shadow-sm"
                  />
                </div>

                {error && <p className="error-message">{error.data?.message || "Invalid credentials"}</p>}

                <Button
                  className="login-btn w-100 py-3 border-0"
                  variant="primary"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="d-flex align-items-center justify-content-center gap-2">
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      <span>Authenticating...</span>
                    </div>
                  ) : (
                    "Login Now"
                  )}
                </Button>
                
                <p className="text-center mt-4 small text-muted">
                    Protect your credentials. Never share admin access.
                </p>
              </Form>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
}

export default Login;
