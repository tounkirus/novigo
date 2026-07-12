"use client";

import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { api } from "@/mock/api";
import type { ServiceReview } from "@/types/services";
import { QueryState } from "@/components/ui/async-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Avatar, Progress } from "@/components/ui/misc";
import { Rating } from "@/components/ui/rating";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { formatDate, formatRating } from "@/lib/utils";

export default function ProReviewsPage() {
  const meQuery = useQuery({ queryKey: ["me-provider"], queryFn: () => api.meProvider() });
  const reviewsQuery = useQuery({
    queryKey: ["me-reviews", meQuery.data?.id],
    queryFn: () => api.serviceReviews(meQuery.data!.id),
    enabled: !!meQuery.data,
  });

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-ink">Avis clients</h2>
        <p className="text-sm text-muted">Ce que vos clients disent de vos prestations.</p>
      </div>

      <QueryState query={reviewsQuery} skeleton={<Skeleton className="h-96 w-full rounded-2xl" />} isEmpty={(d) => d.length === 0} emptyState={<EmptyState title="Aucun avis" description="Vos avis apparaîtront ici après vos premières missions." />}>
        {(reviews) => <ReviewsView reviews={reviews} />}
      </QueryState>
    </div>
  );
}

function ReviewsView({ reviews }: { reviews: ServiceReview[] }) {
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  const dist = [5, 4, 3, 2, 1].map((n) => ({ n, count: reviews.filter((r) => r.rating === n).length }));

  return (
    <>
      <Card className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
        <div className="text-center">
          <p className="text-5xl font-black tracking-tight text-ink">{formatRating(avg)}</p>
          <div className="mt-1 flex justify-center gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => <Star key={n} className={n <= Math.round(avg) ? "h-4 w-4 fill-gold text-gold" : "h-4 w-4 text-line"} />)}
          </div>
          <p className="mt-1 text-[12px] text-muted">{reviews.length} avis</p>
        </div>
        <div className="flex-1 space-y-1.5">
          {dist.map((d) => (
            <div key={d.n} className="flex items-center gap-2 text-[13px]">
              <span className="w-3 text-muted">{d.n}</span>
              <Star className="h-3 w-3 fill-gold text-gold" />
              <Progress value={reviews.length ? (d.count / reviews.length) * 100 : 0} className="flex-1" />
              <span className="w-8 text-right text-muted">{d.count}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="space-y-3">
        {reviews.map((r) => (
          <Card key={r.id} className="p-4">
            <div className="flex items-start gap-3">
              <Avatar src={r.avatar} alt={r.author} size={40} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold text-ink">{r.author}</p>
                    {r.verified && <Badge tone="success">Vérifié</Badge>}
                  </div>
                  <Rating value={r.rating} />
                </div>
                <p className="text-[12px] text-muted">{r.jobType} · {formatDate(r.date)}</p>
                <p className="mt-1.5 text-sm text-ink">{r.comment}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
