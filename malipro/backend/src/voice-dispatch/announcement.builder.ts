// NOVIGO — fabrique des phrases prononcées aux prestataires.
//
// Règle de sécurité (§10 du cahier des charges) : **aucune donnée sensible**.
// Le générateur ne reçoit ni nom de client, ni téléphone, ni adresse précise —
// seulement le métier, le QUARTIER, la distance, le gain et le délai de réponse.
// Ce qui n'entre pas ici ne peut pas être prononcé.

export type AnnouncementKind = "MISSION_ASSIGNED" | "MISSION_AVAILABLE" | "TEST" | "MANUAL";
export type VoiceLanguage = "fr" | "bm";

export interface AnnouncementInput {
  kind: AnnouncementKind;
  /// Famille de service du Brain (DELIVERY, TRANSPORT, HOME_SERVICE, HEALTH…).
  family?: string;
  /// Libellé métier lisible : « Livraison de repas », « Plombier »…
  serviceLabel?: string;
  /// Quartier uniquement (« ACI 2000 »), jamais la rue ni le numéro de porte.
  zone?: string;
  distanceMeters?: number;
  /// Rémunération estimée du prestataire, en francs CFA.
  payout?: number;
  /// Temps laissé pour accepter la mission.
  responseSeconds?: number;
}

/// Nombre prononçable : la synthèse vocale lit « 2500 » correctement, alors
/// qu'un séparateur de milliers lui fait dire « deux » puis « cinq cents ».
function spokenNumber(n: number): string {
  return String(Math.round(n));
}

/// Distance parlée : « 2 kilomètres », « 1,5 kilomètre », « 800 mètres ».
function spokenDistance(meters: number, lang: VoiceLanguage): string {
  if (meters < 1000) {
    return lang === "bm" ? `mɛtɛrɛ ${spokenNumber(meters)}` : `${spokenNumber(meters)} mètres`;
  }
  const km = meters / 1000;
  const value = Number.isInteger(km) ? String(km) : km.toFixed(1).replace(".", ",");
  if (lang === "bm") return `kilomɛtɛrɛ ${value}`;
  return `${value} kilomètre${km >= 2 ? "s" : ""}`;
}

/// Nom du métier prononcé au féminin/masculin correct côté français ;
/// à défaut de libellé, on reste générique (« mission »).
function serviceWording(input: AnnouncementInput): string {
  const label = (input.serviceLabel ?? "").trim();
  if (label) return label.toLowerCase();
  switch ((input.family ?? "").toUpperCase()) {
    case "TRANSPORT":
      return "course";
    case "HOME_SERVICE":
      return "intervention";
    case "HEALTH":
      return "soin à domicile";
    default:
      return "livraison";
  }
}

function buildFr(input: AnnouncementInput): string {
  if (input.kind === "TEST") {
    return "Ceci est un test des annonces vocales NOVIGO. Si vous entendez ce message, le son est correctement réglé.";
  }
  const phrases: string[] = [];
  const family = (input.family ?? "DELIVERY").toUpperCase();
  const lieu = input.zone ? ` à ${input.zone}` : "";

  if (family === "HOME_SERVICE" || family === "HEALTH") {
    phrases.push(`Nouvelle demande de ${serviceWording(input)}${lieu}.`);
  } else if (family === "TRANSPORT") {
    phrases.push(`Nouvelle course disponible${lieu}.`);
  } else {
    phrases.push(`Nouvelle livraison disponible${lieu}.`);
  }

  if (input.distanceMeters && input.distanceMeters > 0) {
    phrases.push(`Distance ${spokenDistance(input.distanceMeters, "fr")}.`);
  }
  if (input.payout && input.payout > 0) {
    phrases.push(`Gain estimé ${spokenNumber(input.payout)} francs CFA.`);
  }
  if (input.responseSeconds && input.responseSeconds > 0) {
    phrases.push(`Vous avez ${spokenNumber(input.responseSeconds)} secondes pour répondre.`);
  }
  return phrases.join(" ");
}

/// Bambara — PREMIÈRE VERSION À FAIRE RELIRE PAR UN LOCUTEUR NATIF avant
/// production. La mécanique (choix de langue, repli, lecture) est complète ;
/// seule la formulation demande une validation humaine. Voir docs/VOICE-DISPATCH.md.
function buildBm(input: AnnouncementInput): string {
  if (input.kind === "TEST") {
    return "Nin ye NOVIGO kumakan sɛgɛsɛgɛli ye. Ni i bɛ nin mɛn, mankan ka ɲi.";
  }
  const phrases: string[] = [];
  const lieu = input.zone ? ` ${input.zone} la` : "";
  phrases.push(`Baara kura bɛ${lieu}.`);
  if (input.distanceMeters && input.distanceMeters > 0) {
    phrases.push(`Yɔrɔ jan ye ${spokenDistance(input.distanceMeters, "bm")} ye.`);
  }
  if (input.payout && input.payout > 0) {
    phrases.push(`I bɛna sɔrɔ fraan ${spokenNumber(input.payout)}.`);
  }
  if (input.responseSeconds && input.responseSeconds > 0) {
    phrases.push(`I ka jaabi di sekɔndi ${spokenNumber(input.responseSeconds)} kɔnɔ.`);
  }
  return phrases.join(" ");
}

/// Texte prononcé pour un prestataire, dans sa langue.
export function buildAnnouncement(input: AnnouncementInput, language: VoiceLanguage): string {
  return language === "bm" ? buildBm(input) : buildFr(input);
}

/// Titre court de la notification push (l'écran verrouillé affiche ceci).
export function pushTitle(input: AnnouncementInput, language: VoiceLanguage): string {
  if (input.kind === "TEST") return language === "bm" ? "NOVIGO sɛgɛsɛgɛli" : "Test NOVIGO";
  return language === "bm" ? "Baara kura NOVIGO" : "Nouvelle mission NOVIGO";
}
