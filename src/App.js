import React, { lazy, Suspense } from "react";
import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute";

const Login = lazy(() => import("./components/login/Login"));
const Main  = lazy(() => import("./components/main/Main"));

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Suspense fallback={<div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh'}}>Loading...</div>}>
          <Routes>
            <Route>
              <Route path="/" element={<Login />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard/*" element={<Main />} />
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </div>
  );
}

export default App;
