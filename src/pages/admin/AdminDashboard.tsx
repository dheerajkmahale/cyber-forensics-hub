import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminOverviewTab from "@/components/admin/AdminOverviewTab";
import AdminConfigTab from "@/components/admin/AdminConfigTab";
import AdminWhitelistTab from "@/components/admin/AdminWhitelistTab";

const AdminDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-background relative">
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <div className="relative z-10">
        <AdminHeader />
        <main className="max-w-7xl mx-auto px-6 py-6">
          <Tabs defaultValue="overview" className="space-y-5">
            <TabsList className="bg-card border border-amber-500/20">
              <TabsTrigger value="overview" className="font-mono text-xs data-[state=active]:bg-amber-500/15 data-[state=active]:text-amber-400">
                Overview
              </TabsTrigger>
              <TabsTrigger value="config" className="font-mono text-xs data-[state=active]:bg-amber-500/15 data-[state=active]:text-amber-400">
                Configuration
              </TabsTrigger>
              <TabsTrigger value="whitelist" className="font-mono text-xs data-[state=active]:bg-amber-500/15 data-[state=active]:text-amber-400">
                Trusted Accounts
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview"><AdminOverviewTab /></TabsContent>
            <TabsContent value="config"><AdminConfigTab /></TabsContent>
            <TabsContent value="whitelist"><AdminWhitelistTab /></TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
