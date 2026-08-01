import { Injectable } from "@nestjs/common";
import { PriceLine, PriceQuote, RoutePlan, ServiceRuntime } from "../brain.types";
import { clamp, roundPrice } from "../geo";

/// SMART PRICING ENGINE — le tarif juste, pas le tarif maximum.
///
/// Le prix se construit ligne par ligne (transparence : le client voit le détail),
/// puis se corrige par la tension réelle de la zone. La majoration est bornée par
/// la politique du métier, et une remise de fidélité protège le pilier « client »
/// du Carré d'Équilibre. La rémunération du prestataire suit la même majoration :
/// une zone tendue paie mieux le prestataire, elle ne fait pas que coûter plus cher.
@Injectable()
export class SmartPricingEngine {
  static readonly VERSION = "1.0.0";

  quote(input: {
    service: ServiceRuntime;
    route: RoutePlan;
    tension: number;
    /// Score de confiance du client (remise de fidélité au-delà de 80).
    clientTrust?: number;
    waitingMinutes?: number;
    /// Panier, pour les métiers dont le tarif dépend de la valeur transportée.
    subtotal?: number;
    /// Frais imposé par le partenaire (ex. livraison offerte : 0).
    partnerFee?: number | null;
  }): PriceQuote {
    const { service, route } = input;
    const p = service.pricing;
    const reasons: string[] = [];
    const breakdown: PriceLine[] = [];

    // Un partenaire peut imposer son propre tarif de livraison (offert compris) :
    // le Brain le respecte et se contente d'expliquer et de répartir.
    if (input.partnerFee != null) {
      const amount = Math.max(0, Math.round(input.partnerFee));
      const commission = Math.round((amount * p.commissionPercent) / 100);
      reasons.push(
        amount === 0
          ? "Livraison offerte par le partenaire."
          : "Tarif de livraison fixé par le partenaire.",
      );
      return {
        amount,
        currency: "XOF",
        breakdown: [{ label: "Livraison partenaire", amount }],
        surge: 1,
        commission,
        providerPayout: amount - commission,
        reasons,
      };
    }

    const km = route.distanceMeters / 1000;
    let subtotal = 0;

    if (p.base > 0) {
      breakdown.push({ label: "Prise en charge", amount: p.base });
      subtotal += p.base;
    }
    if (p.calloutFee) {
      breakdown.push({ label: "Déplacement", amount: p.calloutFee });
      subtotal += p.calloutFee;
    }
    if (p.perKm > 0 && km > 0) {
      const amount = Math.round(p.perKm * km);
      breakdown.push({ label: `Distance (${km.toFixed(1)} km)`, amount });
      subtotal += amount;
      reasons.push(`Distance réelle estimée : ${km.toFixed(1)} km.`);
    }
    if (p.perMinute > 0 && route.etaMinutes > 0) {
      const amount = Math.round(p.perMinute * route.etaMinutes);
      breakdown.push({ label: `Temps (${route.etaMinutes} min)`, amount });
      subtotal += amount;
    }
    const waiting = input.waitingMinutes ?? 0;
    if (p.waitingPerMinute && waiting > 0) {
      const amount = Math.round(p.waitingPerMinute * waiting);
      breakdown.push({ label: `Attente (${waiting} min)`, amount });
      subtotal += amount;
      reasons.push(`Attente constatée : ${waiting} min.`);
    }

    // Tension de la zone : majoration bornée par la politique du métier.
    const surge = Number(clamp(1 + (input.tension - 1) * 0.4, 1, p.surgeMax).toFixed(2));
    if (surge > 1.01) {
      const amount = Math.round(subtotal * (surge - 1));
      breakdown.push({ label: `Forte demande (×${surge.toFixed(2)})`, amount });
      subtotal += amount;
      reasons.push(
        `Zone très demandée : majoration ×${surge.toFixed(2)} (plafond métier ×${p.surgeMax}).`,
      );
    } else {
      reasons.push("Aucune majoration : offre et demande équilibrées.");
    }

    // Pilier client : la fidélité se paie en remise, pas en promesse.
    const trust = input.clientTrust ?? 50;
    if (trust >= 80) {
      const discount = -Math.min(500, Math.round(subtotal * 0.03));
      if (discount < 0) {
        breakdown.push({ label: "Fidélité NOVIGO", amount: discount });
        subtotal += discount;
        reasons.push(`Client fidèle (confiance ${Math.round(trust)}/100) : remise appliquée.`);
      }
    }

    let amount = roundPrice(subtotal);
    if (amount < p.minimum) {
      breakdown.push({ label: "Ajustement tarif minimum", amount: p.minimum - amount });
      amount = p.minimum;
      reasons.push(`Tarif minimum du service appliqué (${p.minimum} XOF).`);
    }

    const commission = Math.round((amount * p.commissionPercent) / 100);
    return {
      amount,
      currency: "XOF",
      breakdown,
      surge,
      commission,
      providerPayout: amount - commission,
      reasons,
    };
  }
}
