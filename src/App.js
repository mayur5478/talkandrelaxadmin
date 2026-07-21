import React, { lazy, Suspense } from "react";
import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute";
import RoleRoute from "./routes/RoleRoute";

const Login = lazy(() => import("./components/login/Login"));
const Main  = lazy(() => import("./components/main/Main"));
const OnboardingForm = lazy(() => import("./components/listener-onboarding/OnboardingForm"));

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Suspense fallback={<div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh'}}>Loading...</div>}>
          <Routes>
            <Route>
              <Route path="/" element={<Login />} />
              {/* Public route — no auth required, token validates access */}
              <Route path="/onboarding/:token" element={<OnboardingForm />} />
              <Route element={<ProtectedRoute />}>
                <Route element={<RoleRoute />}>
                  <Route path="/dashboard/*" element={<Main />} />
                </Route>
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </div>
  );
}

export default App;
