import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "./status-badge";

/**
 * Vérifie le mapping statut -> ton (classes de jetons) + libellé FR.
 * Les classes de tons sont dérivées des jetons sémantiques (globals.css),
 * donc elles s'adaptent au mode sombre — on teste ici le mapping logique.
 */
describe("StatusBadge", () => {
  it("affiche le libellé français d'un statut connu", () => {
    render(<StatusBadge status="DELIVERED" />);
    expect(screen.getByText("Livrée")).toBeInTheDocument();
  });

  it("retombe sur le statut brut pour un statut inconnu (ton muted)", () => {
    render(<StatusBadge status="WOBBLE" />);
    const el = screen.getByText("WOBBLE");
    expect(el).toHaveClass("bg-line", "text-muted");
  });

  it.each([
    ["DELIVERED", ["bg-brand-soft", "text-brand-dark"]], // succès
    ["SUCCEEDED", ["bg-brand-soft", "text-brand-dark"]],
    ["CONFIRMED", ["bg-info-soft", "text-info"]], // en cours
    ["PENDING", ["bg-gold-soft", "text-gold-dark"]], // attente
    ["FAILED", ["bg-error-soft", "text-error"]], // échec
    ["CANCELLED", ["bg-error-soft", "text-error"]],
    ["MISSING_IN_PROVIDER", ["bg-error-soft", "text-error"]], // réconciliation
    ["NOT_SUBMITTED", ["bg-line", "text-muted"]], // neutre
  ])("applique le bon ton pour %s", (status, classes) => {
    const { container } = render(<StatusBadge status={status} />);
    const span = container.querySelector("span")!;
    for (const c of classes) expect(span).toHaveClass(c);
  });

  it("est une pastille arrondie compacte", () => {
    const { container } = render(<StatusBadge status="ACTIVE" />);
    const span = container.querySelector("span")!;
    expect(span).toHaveClass("rounded-full", "text-xs");
  });
});
