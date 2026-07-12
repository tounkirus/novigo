"use client";

import { ErrorState } from "@/components/ui/states";

export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <ErrorState onRetry={reset} />
    </div>
  );
}
