"use client";

import type { ReactNode } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { EmptyState, ErrorState } from "./states";

/**
 * Rendu uniforme des états d'un chargement asynchrone.
 * Usage direct :
 *   <AsyncState loading={isLoading} error={isError} empty={list.length===0}
 *     skeleton={<GridSkeleton/>} emptyState={<EmptyState .../>} onRetry={refetch}>
 *     {content}
 *   </AsyncState>
 */
export function AsyncState({
  loading,
  error,
  empty,
  skeleton,
  emptyState,
  onRetry,
  children,
}: {
  loading?: boolean;
  error?: boolean;
  empty?: boolean;
  skeleton: ReactNode;
  emptyState?: ReactNode;
  onRetry?: () => void;
  children: ReactNode;
}) {
  if (loading) return <>{skeleton}</>;
  if (error) return <ErrorState onRetry={onRetry} />;
  if (empty) return <>{emptyState ?? <EmptyState title="Rien à afficher" description="Aucune donnée pour le moment." />}</>;
  return <>{children}</>;
}

/**
 * Pont TanStack Query → AsyncState.
 * <QueryState query={q} skeleton={...} isEmpty={(d)=>!d.length}>{(data)=>...}</QueryState>
 */
export function QueryState<T>({
  query,
  skeleton,
  emptyState,
  isEmpty,
  children,
}: {
  query: UseQueryResult<T>;
  skeleton: ReactNode;
  emptyState?: ReactNode;
  isEmpty?: (data: T) => boolean;
  children: (data: T) => ReactNode;
}) {
  return (
    <AsyncState
      loading={query.isLoading}
      error={query.isError}
      empty={query.data != null && isEmpty ? isEmpty(query.data) : false}
      skeleton={skeleton}
      emptyState={emptyState}
      onRetry={() => query.refetch()}
    >
      {query.data != null ? children(query.data) : null}
    </AsyncState>
  );
}
