"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import type { Store } from "@/types";
import { StoreCard } from "@/components/shared/store-card";
import { Button } from "@/components/ui/button";

const STEP = 24;

export function CatalogResults({ stores }: { stores: Store[] }) {
  const [visible, setVisible] = React.useState(STEP);
  const shown = stores.slice(0, visible);
  const hasMore = visible < stores.length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((s, i) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: Math.min((i % STEP) * 0.03, 0.4) }}
          >
            <StoreCard store={s} priority={i < 3} />
          </motion.div>
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-1">
          <Button variant="secondary" size="lg" onClick={() => setVisible((v) => v + STEP)}>
            <Plus className="h-4 w-4" />
            Voir plus de commerces
          </Button>
        </div>
      )}
    </div>
  );
}
