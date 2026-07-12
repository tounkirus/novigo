import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-shell px-6 text-center">
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl brand-gradient text-white shadow-glow">
        <Compass className="h-10 w-10" />
      </div>
      <p className="text-5xl font-black text-ink">404</p>
      <h1 className="mt-2 text-lg font-semibold text-ink">Page introuvable</h1>
      <p className="mt-1 max-w-sm text-sm text-muted">
        Cette page n'existe pas ou a été déplacée. Retournons à l'accueil de NOVIGO.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex h-11 items-center rounded-xl brand-gradient px-6 text-sm font-semibold text-white shadow-glow"
      >
        Retour à l'accueil
      </Link>
    </div>
  );
}
