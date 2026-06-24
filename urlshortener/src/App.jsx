// src/App.jsx
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/login.jsx";
import Register from "./pages/register.jsx";
import Dashboard from "./pages/dashboard.jsx";
import LandingPage from "./pages/landing.jsx";
import OAuthCallback from "./pages/oauthCallback.jsx";
// import UrlListPage from "./pages/urls.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/oauth/callback" element={<OAuthCallback />} />
        {/* <Route path="/urls" element={<UrlListPage />} /> */}
      </Routes>
    </BrowserRouter>
  );
}
