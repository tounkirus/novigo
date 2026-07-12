#!/usr/bin/env bash
# ============================================================================
# NOVIGO — Pousse le monorepo sur un remote GitHub.
#
# ÉTAPE 0 (côté toi) : crée un dépôt VIDE sur github.com
#   → « New repository », SANS README, SANS .gitignore, SANS licence
#     (sinon le premier push sera rejeté pour non-fast-forward).
#
# UTILISATION :
#   ./push-github.sh https://github.com/<user>/<repo>.git
#   # ou en SSH :
#   ./push-github.sh git@github.com:<user>/<repo>.git
#
# Git te demandera tes identifiants GitHub au push :
#   - HTTPS : nom d'utilisateur + Personal Access Token (PAS le mot de passe).
#   - SSH   : ta clé SSH doit être ajoutée à ton compte GitHub.
# ============================================================================
set -euo pipefail

URL="${1:-${GITHUB_REMOTE:-}}"
[ -n "$URL" ] || { echo "❌ Usage: $0 <url-remote-github>"; exit 1; }

# Doit tourner à la racine du monorepo (là où est le .git).
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || { echo "❌ Pas dans un dépôt git."; exit 1; }

if git remote | grep -qx origin; then
  echo "ℹ origin existe déjà → mise à jour de l'URL"
  git remote set-url origin "$URL"
else
  git remote add origin "$URL"
fi
git branch -M main

echo "✅ Remote origin → $URL"
echo "▶ Push de 'main' (identifiants GitHub demandés)…"
git push -u origin main
echo "🎉 Poussé. Connecte ce repo dans Codemagic, puis ./trigger-ios-builds.sh"
