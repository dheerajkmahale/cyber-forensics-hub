import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import MatrixRain from "@/components/MatrixRain";
import { useAuth } from "@/contexts/AuthContext";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="relative min-h-screen bg-background hex-pattern flex items-center justify-center overflow-hidden">
        <MatrixRain />
        <div className="relative z-10 flex items-center gap-3 rounded-md border border-border/50 bg-card/60 px-5 py-4 font-mono text-sm text-primary shadow-sm backdrop-blur-sm">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          AUTHENTICATING SESSION
        </div>
      </div>
    );
  }

  if (!session) return <Navigate to="/auth" replace state={{ from: location }} />;

  return <>{children}</>;
};

export default ProtectedRoute;