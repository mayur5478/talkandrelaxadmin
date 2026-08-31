import React, { lazy, Suspense } from "react";
import "./App.css";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute";
import RoleRoute from "./routes/RoleRoute";

const Login = lazy(() => import("./components/login/Login"));
const Main  = lazy(() => import("./components/main/Main"));
const OnboardingForm = lazy(() => import("./components/listener-onboarding/OnboardingForm"));
const ApplyPage = lazy(() => import("./components/listener-onboarding/ApplyPage"));

// The candidate-facing domain (goes in WorkIndia ads). When the app is served
// from this hostname, ONLY the apply/onboarding routes exist — the admin login
// and dashboard are unreachable, so the ad URL never exposes the admin panel.
const ONBOARD_HOST =
  process.env.REACT_APP_ONBOARD_HOST || "join.talkandrelax.com";
const isOnboardHost = window.location.hostname === ONBOARD_HOST;

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Suspense fallback={<div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh'}}>Loading...</div>}>
          <Routes>
            {isOnboardHost ? (
              <Route>
                <Route path="/apply" element={<ApplyPage />} />
                <Route path="/onboarding/:token" element={<OnboardingForm />} />
                <Route path="*" element={<Navigate to="/apply" replace />} />
              </Route>
            ) : (
              <Route>
                <Route path="/" element={<Login />} />
                {/* Public route — no auth required, token validates access */}
                <Route path="/onboarding/:token" element={<OnboardingForm />} />
                {/* Public self-serve listener application (WorkIndia ads) */}
                <Route path="/apply" element={<ApplyPage />} />
                <Route element={<ProtectedRoute />}>
                  <Route element={<RoleRoute />}>
                    <Route path="/dashboard/*" element={<Main />} />
                  </Route>
                </Route>
              </Route>
            )}
          </Routes>
        </Suspense>
      </BrowserRouter>
    </div>
  );
}

export default App;
