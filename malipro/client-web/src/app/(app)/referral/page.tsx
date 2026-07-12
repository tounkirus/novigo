"use client";

import { useQuery } from "@tanstack/react-query";
import { Gift } from "lucide-react";
import { api } from "@/mock/api";
import { QueryState } from "@/components/ui/async-state";
import { ReferralView, ReferralSkeleton } from "@/features/referral/components";

export default function ReferralPage() {
  const query = useQuery({ queryKey: ["referral"], queryFn: () => api.referral() });

  return (
    <div className="px-4 py-4 space-y-6">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-soft text-brand">
          <Gift className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-ink">Parrainage</h1>
          <p className="text-[13px] text-muted">Invitez vos amis et gagnez des récompenses ensemble</p>
        </div>
      </div>

      <QueryState query={query} skeleton={<ReferralSkeleton />}>
        {(referral) => <ReferralView referral={referral} />}
      </QueryState>
    </div>
  );
}
