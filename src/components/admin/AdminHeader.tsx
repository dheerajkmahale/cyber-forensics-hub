import React from "react";
import { ShieldAlert, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const AdminHeader: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin/login", { replace: true });
  };

  return (
    <header className="border-b border-amber-500/30 bg-background/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-md border border-amber-500/50 bg-amber-500/10 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="font-mono text-lg font-bold text-amber-400 tracking-wider">ADMIN PORTAL</h1>
            <p className="font-mono text-[11px] text-muted-foreground">SYSTEM CONTROL · RESTRICTED ACCESS</p>
          </div>
          <span className="ml-3 px-2 py-0.5 text-[10px] font-mono font-bold tracking-widest rounded border border-amber-500/60 text-amber-400 bg-amber-500/10">
            ADMIN
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-muted-foreground hidden sm:inline">{user?.email}</span>
          <Button variant="outline" size="sm" onClick={handleSignOut} className="border-amber-500/40 text-amber-400 hover:bg-amber-500/10">
            <LogOut className="w-4 h-4 mr-1.5" /> Sign out
          </Button>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
