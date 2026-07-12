"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BannersTab } from "@/features/backoffice/cms/banners-tab";
import { PagesTab } from "@/features/backoffice/cms/pages-tab";
import { CollectionsTab } from "@/features/backoffice/cms/collections-tab";
import { MediaTab } from "@/features/backoffice/cms/media-tab";

export default function AdminCmsPage() {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-ink">CMS · Contenus</h2>
        <p className="text-sm text-muted">Gérez les bannières, pages, collections et médias de NOVIGO.</p>
      </div>

      <Tabs defaultValue="banners">
        <TabsList className="flex-wrap">
          <TabsTrigger value="banners">Bannières</TabsTrigger>
          <TabsTrigger value="pages">Pages</TabsTrigger>
          <TabsTrigger value="collections">Collections</TabsTrigger>
          <TabsTrigger value="media">Médiathèque</TabsTrigger>
        </TabsList>

        <TabsContent value="banners">
          <BannersTab />
        </TabsContent>
        <TabsContent value="pages">
          <PagesTab />
        </TabsContent>
        <TabsContent value="collections">
          <CollectionsTab />
        </TabsContent>
        <TabsContent value="media">
          <MediaTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
