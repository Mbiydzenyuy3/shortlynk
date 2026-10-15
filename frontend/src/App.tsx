// src/App.jsx
import "./App.css";
import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/landing.jsx";

// App routes are lazy-loaded so prerendered marketing pages do not ship the
// dashboard, auth and analytics bundles.
const Login = lazy(() => import("./pages/login.jsx"));
const Register = lazy(() => import("./pages/register.jsx"));
const Dashboard = lazy(() => import("./pages/dashboard.jsx"));
const OAuthCallback = lazy(() => import("./pages/oauthCallback.jsx"));
const UrlListPage = lazy(() => import("./pages/urls.jsx"));

// Shared by the browser entry (below) and the prerenderer (entry-server.jsx),
// which supply BrowserRouter and StaticRouter respectively.
export function AppRoutes() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/oauth/callback" element={<OAuthCallback />} />
        <Route path="/urls" element={<UrlListPage />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
