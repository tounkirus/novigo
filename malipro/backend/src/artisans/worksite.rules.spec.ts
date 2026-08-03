import {
  autoAcceptDeadline,
  initialStatus,
  minutesLeftToAccept,
  shouldAutoAccept,
  transition,
  warrantyFromQuotation,
  type WorksiteAction,
  type WorksiteStatus,
} from "./worksite.rules";

const T0 = new Date("2026-08-03T09:00:00Z");
const at = (minutes: number) => new Date(T0.getTime() + minutes * 60_000);

describe("Chantier (Module Artisans, chapitre 5)", () => {
  describe("création (§2)", () => {
    it("est prêt à démarrer sans acompte", () => {
      expect(initialStatus(0)).toBe("READY");
    });

    it("attend l'acompte quand il est exigé", () => {
      expect(initialStatus(30_000)).toBe("AWAITING_DEPOSIT");
    });

    it("est prêt si l'acompte est déjà réglé", () => {
      expect(initialStatus(30_000, 30_000)).toBe("READY");
    });

    it("attend encore sur un acompte partiel", () => {
      expect(initialStatus(30_000, 10_000)).toBe("AWAITING_DEPOSIT");
    });
  });

  describe("parcours nominal (§3)", () => {
    it("déroule acompte → prêt → en cours → terminé → clôturé", () => {
      let status: WorksiteStatus = "AWAITING_DEPOSIT";
      for (const action of ["PAY_DEPOSIT", "START", "FINISH", "ACCEPT"] as WorksiteAction[]) {
        const r = transition(status, action);
        expect(r.reason).toBeNull();
        status = r.next!;
      }
      expect(status).toBe("CLOSED");
    });
  });

  describe("transitions interdites (§11)", () => {
    it("refuse de démarrer tant que l'acompte n'est pas réglé", () => {
      const r = transition("AWAITING_DEPOSIT", "START");
      expect(r.next).toBeNull();
      expect(r.reason).toMatch(/acompte/);
    });

    it("refuse de terminer des travaux jamais commencés", () => {
      expect(transition("READY", "FINISH").next).toBeNull();
    });

    it("refuse de réceptionner un chantier encore en cours", () => {
      expect(transition("IN_PROGRESS", "ACCEPT").next).toBeNull();
    });

    it("rend un chantier clôturé terminal", () => {
      for (const action of ["START", "FINISH", "ACCEPT", "OPEN_DISPUTE"] as WorksiteAction[]) {
        expect(transition("CLOSED", action).next).toBeNull();
      }
    });

    it("n'accepte pas deux fois le même chantier", () => {
      expect(transition("CLOSED", "AUTO_ACCEPT").next).toBeNull();
    });
  });

  describe("litige (§7)", () => {
    it("s'ouvre depuis la réception", () => {
      expect(transition("WORK_DONE", "OPEN_DISPUTE").next).toBe("DISPUTED");
    });

    it("ne s'ouvre pas avant la fin des travaux", () => {
      expect(transition("IN_PROGRESS", "OPEN_DISPUTE").next).toBeNull();
    });

    it("se clôt par décision de l'administration", () => {
      expect(transition("DISPUTED", "RESOLVE_DISPUTE").next).toBe("CLOSED");
    });
  });

  describe("réception automatique après une heure (§6)", () => {
    it("fixe l'échéance à 60 minutes après la fin des travaux", () => {
      expect(autoAcceptDeadline(T0).toISOString()).toBe(at(60).toISOString());
    });

    it("ne se déclenche pas avant l'échéance", () => {
      const s = { status: "WORK_DONE" as const, autoAcceptAt: at(60) };
      expect(shouldAutoAccept(s, at(59))).toBe(false);
    });

    it("se déclenche à l'échéance", () => {
      const s = { status: "WORK_DONE" as const, autoAcceptAt: at(60) };
      expect(shouldAutoAccept(s, at(60))).toBe(true);
    });

    it("est suspendue par un litige ouvert avant l'échéance", () => {
      // Sans cela, le silence de l'administration vaudrait accord contre le client.
      const s = { status: "DISPUTED" as const, autoAcceptAt: at(60) };
      expect(shouldAutoAccept(s, at(120))).toBe(false);
    });

    it("ne concerne pas un chantier déjà clôturé", () => {
      const s = { status: "CLOSED" as const, autoAcceptAt: at(60) };
      expect(shouldAutoAccept(s, at(120))).toBe(false);
    });

    it("indique le temps restant au client", () => {
      const s = { status: "WORK_DONE" as const, autoAcceptAt: at(60) };
      expect(minutesLeftToAccept(s, at(45))).toBe(15);
      expect(minutesLeftToAccept(s, at(90))).toBe(0);
    });
  });

  describe("garantie (§8)", () => {
    it("est reprise du devis", () => {
      expect(warrantyFromQuotation({ warrantyMonths: 12, warrantyTerms: "Pièces et main-d'œuvre" }))
        .toEqual({ months: 12, terms: "Pièces et main-d'œuvre" });
    });

    it("reste vide quand le devis n'en propose pas", () => {
      expect(warrantyFromQuotation({})).toEqual({ months: null, terms: null });
    });
  });
});
