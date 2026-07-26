import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import MatrixRain from "@/components/MatrixRain";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useAuth } from "@/contexts/AuthContext";

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, loading: authLoading } = useAuth();
  const { isAdmin, loading } = useIsAdmin();
  const location = useLocation();

  if (authLoading || loading) {
    return (
      <div className="relative min-h-screen bg-background flex items-center justify-center overflow-hidden">
        <MatrixRain />
        <div className="relative z-10 rounded-md border border-amber-500/40 bg-card/70 px-5 py-4 font-mono text-sm text-amber-400 shadow-sm backdrop-blur-sm">
          VERIFYING ADMIN CLEARANCE…
        </div>
      </div>
    );
  }

  if (!session) return <Navigate to="/admin/login" replace state={{ from: location }} />;
  if (!isAdmin) return <Navigate to="/admin/login" replace state={{ denied: true }} />;

  return <>{children}</>;
};

export default AdminRoute;
