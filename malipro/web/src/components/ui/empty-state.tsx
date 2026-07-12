export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 py-16 text-center">
      <div className="mb-2 h-10 w-10 rounded-full bg-brand-soft" />
      <p className="text-sm font-medium text-ink">{title}</p>
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}
