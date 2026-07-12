type Vars = Record<string, string>;
export interface RenderedEmail { subject: string; html: string; }

const wrap = (title: string, body: string) => `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#101613">
<div style="max-width:520px;margin:0 auto;padding:24px">
<h2 style="color:#5B4BE1">NOVIGO</h2><h3>${title}</h3>${body}
<p style="color:#64726B;font-size:12px;margin-top:24px">Message automatique — NOVIGO Mali.</p></div></body></html>`;

/// Gabarits e-mail (versionnés dans le code ; une table email_templates éditable
/// pourra les surcharger ultérieurement).
export const EMAIL_TEMPLATES: Record<string, (v: Vars) => RenderedEmail> = {
  welcome: (v) => ({ subject: "Bienvenue sur NOVIGO",
    html: wrap("Bienvenue " + (v.name ?? "") + " !", "<p>Votre compte est activé. Bonne découverte de NOVIGO.</p>") }),
  otp: (v) => ({ subject: "Votre code NOVIGO",
    html: wrap("Code de vérification", `<p style="font-size:22px;font-weight:bold">${v.code ?? ""}</p><p>Valide 5 minutes.</p>`) }),
  "password-reset": (v) => ({ subject: "Réinitialisation du mot de passe",
    html: wrap("Réinitialisation", `<p>Utilisez ce code/lien pour réinitialiser votre mot de passe :</p>
      <p style="font-size:16px;font-weight:bold">${v.token ?? ""}</p><p>Valide 30 minutes. Ignorez si vous n'êtes pas à l'origine.</p>`) }),
  invoice: (v) => ({ subject: `Facture ${v.reference ?? ""}`,
    html: wrap("Facture", `<p>Commande <b>${v.reference ?? ""}</b> — Montant : <b>${v.amount ?? ""} FCFA</b>.</p>`) }),
  admin: (v) => ({ subject: v.subject ?? "Notification NOVIGO",
    html: wrap(v.subject ?? "Notification", `<p>${v.body ?? ""}</p>`) }),
};
