"use client";

import { LayoutDashboard, Activity, SlidersHorizontal, UsersRound, ShieldCheck, ToggleRight, ScrollText } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CommandCenterTab } from "@/features/backoffice/system/command-center";
import { SystemHealthTab } from "@/features/backoffice/system/system-health";
import { PlatformConfigTab } from "@/features/backoffice/system/platform-config";
import { TeamPanelTab } from "@/features/backoffice/system/team-panel";
import { RolesTab } from "@/features/backoffice/system/roles-panel";
import { FeatureFlagsTab } from "@/features/backoffice/system/feature-flags";
import { AuditLogTab } from "@/features/backoffice/system/audit-log";

export default function AdminSystemPage() {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-ink">Console Super Admin</h2>
        <p className="text-sm text-muted">Command center, configuration, accès et supervision de la plateforme NOVIGO.</p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview"><LayoutDashboard className="h-4 w-4" /> Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="config"><SlidersHorizontal className="h-4 w-4" /> Configuration</TabsTrigger>
          <TabsTrigger value="team"><UsersRound className="h-4 w-4" /> Équipe &amp; accès</TabsTrigger>
          <TabsTrigger value="health"><Activity className="h-4 w-4" /> Santé système</TabsTrigger>
          <TabsTrigger value="roles"><ShieldCheck className="h-4 w-4" /> Rôles &amp; permissions</TabsTrigger>
          <TabsTrigger value="flags"><ToggleRight className="h-4 w-4" /> Feature flags</TabsTrigger>
          <TabsTrigger value="audit"><ScrollText className="h-4 w-4" /> Journal d'audit</TabsTrigger>
        </TabsList>

        <TabsContent value="overview"><CommandCenterTab /></TabsContent>
        <TabsContent value="config"><PlatformConfigTab /></TabsContent>
        <TabsContent value="team"><TeamPanelTab /></TabsContent>
        <TabsContent value="health"><SystemHealthTab /></TabsContent>
        <TabsContent value="roles"><RolesTab /></TabsContent>
        <TabsContent value="flags"><FeatureFlagsTab /></TabsContent>
        <TabsContent value="audit"><AuditLogTab /></TabsContent>
      </Tabs>
    </div>
  );
}
