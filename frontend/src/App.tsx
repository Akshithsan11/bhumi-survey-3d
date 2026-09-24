import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Layout } from "./components/Layout";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { Dashboard } from "./pages/Dashboard";
import { Map3D } from "./pages/Map3D";
import { Analysis } from "./pages/Analysis";
import { ULPINPage } from "./pages/ULPINPage";
import { Validation } from "./pages/Validation";
import { Infrastructure } from "./pages/Infrastructure";
import { Settings } from "./pages/Settings";
import { Prototypes } from "./pages/Prototypes";
import type { ReactNode } from "react";

function Protected({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route element={<Layout />}>
        {/* Guest-observable pages */}
        <Route path="/map" element={<Map3D />} />
        <Route path="/infrastructure" element={<Infrastructure />} />
        <Route path="/ulpin" element={<ULPINPage />} />
        <Route path="/prototypes" element={<Prototypes />} />

        {/* Auth-required pages */}
        <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
        <Route path="/analysis" element={<Protected><Analysis /></Protected>} />
        <Route path="/validation" element={<Protected><Validation /></Protected>} />
        <Route path="/settings" element={<Protected><Settings /></Protected>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
