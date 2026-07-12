#!/usr/bin/env bash
# ============================================================================
# NOVIGO — Déclenche les builds iOS des 3 apps via l'API Codemagic.
# Monorepo : UNE app Codemagic (le repo) + 3 workflows (client/driver/merchant-ios).
# Produit un IPA signé → TestFlight par app.
#
# PRÉREQUIS (une seule fois, côté toi) :
#   1. Repo poussé sur GitHub (fait : github.com/tounkirus/novigo) et connecté
#      dans Codemagic (Applications → Add application → ce repo).
#   2. Compte Apple Developer + clé App Store Connect API, ajoutée dans Codemagic
#      comme intégration « NOVIGO_ASC_API_KEY » (référencée par codemagic.yaml).
#   3. Groupe d'env « novigo » dans Codemagic : APP_STORE_APPLE_ID + NOVIGO_API
#      (URL HTTPS publique STABLE du Gateway — pas un tunnel éphémère).
#
# UTILISATION :
#   export CODEMAGIC_API_TOKEN=xxx    # Codemagic → Teams → API token
#   export REPO_APP_ID=...            # id dans l'URL codemagic.io/app/<ID>
#   ./trigger-ios-builds.sh           # (BRANCH=main par défaut)
#
# Option : WORKFLOWS="client-ios driver-ios" pour n'en lancer qu'une partie.
# ============================================================================
set -euo pipefail

API="https://api.codemagic.io/builds"
TOKEN="${CODEMAGIC_API_TOKEN:-}"
BRANCH="${BRANCH:-main}"
REPO_APP_ID="${REPO_APP_ID:-}"
WORKFLOWS="${WORKFLOWS:-client-ios driver-ios merchant-ios}"

fail() { echo "❌ $1" >&2; exit 1; }
[ -n "$TOKEN" ]       || fail "CODEMAGIC_API_TOKEN manquant (Codemagic → Teams → Personal Account → API token)."
[ -n "$REPO_APP_ID" ] || fail "REPO_APP_ID manquant (id dans l'URL codemagic.io/app/<ID> de l'app connectée)."

triggered=0
trigger() {
  local wf="$1"
  echo "▶ workflow « $wf » sur « $BRANCH »…"
  local resp bid
  resp=$(curl -sS -X POST "$API" \
    -H "x-auth-token: $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"appId\":\"$REPO_APP_ID\",\"workflowId\":\"$wf\",\"branch\":\"$BRANCH\"}") || fail "appel API échoué ($wf)"
  bid=$(printf '%s' "$resp" | grep -oE '"buildId"[[:space:]]*:[[:space:]]*"[^"]+"' | head -1 | sed 's/.*"\([^"]*\)"$/\1/')
  if [ -n "$bid" ]; then
    echo "  ✅ build lancé : https://codemagic.io/app/$REPO_APP_ID/build/$bid"
    triggered=$((triggered + 1))
  else
    echo "  ⚠ réponse inattendue : $resp"
  fi
}

echo "== NOVIGO · déclenchement builds iOS (Codemagic) =="
for wf in $WORKFLOWS; do trigger "$wf"; done
echo "-- $triggered build(s) déclenché(s). Suivi : https://codemagic.io/apps --"
