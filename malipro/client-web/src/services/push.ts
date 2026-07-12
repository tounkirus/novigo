/**
 * Notifications push NOVIGO — abstraction (mock Firebase Cloud Messaging).
 * En production : initialiser Firebase, demander la permission, récupérer le token FCM
 * et l'envoyer au back-end. L'API publique (`registerPush`, `onPushMessage`) reste stable.
 */
export interface PushRegistration {
  token: string;
  granted: boolean;
}

/** Simule l'enregistrement au service push et renvoie un token déterministe. */
export async function registerPush(): Promise<PushRegistration> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return { token: "", granted: false };
  }
  await new Promise((r) => setTimeout(r, 300));
  // En mock, on ne déclenche pas la vraie demande de permission navigateur.
  return { token: "fcm-mock-token-novigo", granted: true };
}

type PushHandler = (msg: { title: string; body: string }) => void;
const listeners = new Set<PushHandler>();

export function onPushMessage(handler: PushHandler): () => void {
  listeners.add(handler);
  return () => listeners.delete(handler);
}

/** Utilisé par la couche mock pour pousser une notification locale. */
export function __emitPush(title: string, body: string) {
  listeners.forEach((h) => h({ title, body }));
}
