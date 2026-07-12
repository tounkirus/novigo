/**
 * Couche temps réel NOVIGO.
 * Implémentation MOCK d'un canal type WebSocket (émet des événements simulés).
 * Pour passer en production : remplacer `createChannel` par une vraie connexion
 * WebSocket / Socket.IO / Firebase Realtime — l'API publique reste identique.
 */
import { NOW } from "@/constants";

export type RealtimeEvent<T = unknown> = { type: string; payload: T; at: number };
type Handler<T = unknown> = (e: RealtimeEvent<T>) => void;

export interface Channel {
  on: (type: string, handler: Handler) => () => void;
  emit: (type: string, payload: unknown) => void;
  close: () => void;
}

/**
 * Crée un canal simulé. `driver_location` et `order_status` sont émis
 * périodiquement pour animer le suivi de commande en direct.
 */
export function createChannel(topic: string): Channel {
  const handlers = new Map<string, Set<Handler>>();
  let closed = false;
  const timers: ReturnType<typeof setInterval>[] = [];

  const emit = (type: string, payload: unknown) => {
    if (closed) return;
    handlers.get(type)?.forEach((h) => h({ type, payload, at: NOW }));
  };

  const on = (type: string, handler: Handler) => {
    if (!handlers.has(type)) handlers.set(type, new Set());
    handlers.get(type)!.add(handler);
    return () => handlers.get(type)?.delete(handler);
  };

  // Simulation : progression d'un livreur le long d'un trajet.
  if (topic.startsWith("order:") || topic.startsWith("trip:")) {
    let step = 0;
    timers.push(
      setInterval(() => {
        step = Math.min(100, step + 4);
        emit("driver_location", { progress: step });
        if (step >= 100) emit("order_status", { status: "DELIVERED" });
      }, 2500),
    );
  }

  const close = () => {
    closed = true;
    timers.forEach(clearInterval);
    handlers.clear();
  };

  return { on, emit, close };
}
