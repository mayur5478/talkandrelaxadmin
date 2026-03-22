import React, { useEffect, useState } from "react";
// Import the mutation hook
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
  const {
    data: user,
    refetch,
    isLoading: isUserLoading,
    error: userError,
  } = useGetMeQuery(null, {
    skip: !getCookie("token") && !localStorage.getItem("token"),
  });
  console.log("user", user);
  const navigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await login({ email, password }).unwrap();
      console.log("Login successful:", response);
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
      console.log("User logged in: ", user);
      navigate("/dashboard/analytics");
    }
  }, [user, navigate]);
  return (
    <div className="login-main">
      <Row className="row-class">
        <Col sm={12} md={6} lg={6}>
          <img className="login-img" src={loginImage} alt="login" />
        </Col>
        <Col sm={12} md={6} lg={6}>
          <div className="form-section">
            <p className="title">Login</p>
            <p className="sub-title">Please enter your email and password</p>
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-1" controlId="formBasicEmail">
                <img className="input-img" src={emailImage} alt="email" />
                <Form.Control
                  type="email"
                  placeholder="Enter email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="formBasicPassword">
                <img className="input-img" src={passwordImage} alt="password" />
                <Form.Control
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Form.Group>

              {error && <p className="error-message">{error.message}</p>}
              <Button
                className="login-btn mt-3"
                variant="primary"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Login Now"}
              </Button>
            </Form>
          </div>
        </Col>
      </Row>
    </div>
  );
}

export default Login;
