#!/usr/bin/env bash
# ============================================================================
# NOVIGO — Déclenche les builds iOS (workflow « ios-appstore ») des 3 apps
# via l'API Codemagic. Produit un IPA signé → TestFlight par app.
#
# PRÉREQUIS (une seule fois, côté toi) :
#   1. Code poussé sur un remote git (GitHub/GitLab/Bitbucket) et repo connecté
#      dans Codemagic (Applications → Add application).
#   2. Compte Apple Developer + clé App Store Connect API, ajoutée dans Codemagic
#      comme intégration nommée « NOVIGO_ASC_API_KEY » (référencée par codemagic.yaml).
#   3. Groupe d'env « novigo » dans Codemagic : APP_STORE_APPLE_ID + NOVIGO_API
#      (URL HTTPS publique STABLE du Gateway — pas un tunnel éphémère).
#
# UTILISATION :
#   export CODEMAGIC_API_TOKEN=xxx          # Codemagic → Teams → API token
#   export CLIENT_APP_ID=...                # id dans l'URL codemagic.io/app/<ID>
#   export DRIVER_APP_ID=...
#   export MERCHANT_APP_ID=...
#   ./trigger-ios-builds.sh                 # (BRANCH=main par défaut)
#
# Options : BRANCH=<branche> WORKFLOW=<id-workflow> pour surcharger.
# ============================================================================
set -euo pipefail

API="https://api.codemagic.io/builds"
TOKEN="${CODEMAGIC_API_TOKEN:-}"
BRANCH="${BRANCH:-main}"
WORKFLOW="${WORKFLOW:-ios-appstore}"

# App IDs Codemagic (Applications → chaque app → segment <ID> de l'URL).
CLIENT_APP_ID="${CLIENT_APP_ID:-}"
DRIVER_APP_ID="${DRIVER_APP_ID:-}"
MERCHANT_APP_ID="${MERCHANT_APP_ID:-}"

fail() { echo "❌ $1" >&2; exit 1; }

[ -n "$TOKEN" ] || fail "CODEMAGIC_API_TOKEN manquant (Codemagic → Teams → Personal Account → API token)."

triggered=0
trigger() {
  local name="$1" appid="$2"
  if [ -z "$appid" ]; then
    echo "⏭  $name : app-id vide → ignoré (export ${name^^}_APP_ID=...)"
    return
  fi
  echo "▶ $name : déclenchement du workflow « $WORKFLOW » sur « $BRANCH »…"
  local resp bid
  resp=$(curl -sS -X POST "$API" \
    -H "x-auth-token: $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"appId\":\"$appid\",\"workflowId\":\"$WORKFLOW\",\"branch\":\"$BRANCH\"}") || fail "appel API échoué ($name)"
  bid=$(printf '%s' "$resp" | grep -oE '"buildId"[[:space:]]*:[[:space:]]*"[^"]+"' | head -1 | sed 's/.*"\([^"]*\)"$/\1/')
  if [ -n "$bid" ]; then
    echo "  ✅ build lancé : https://codemagic.io/app/$appid/build/$bid"
    triggered=$((triggered + 1))
  else
    echo "  ⚠ réponse inattendue : $resp"
  fi
}

echo "== NOVIGO · déclenchement builds iOS (Codemagic) =="
trigger "client"   "$CLIENT_APP_ID"
trigger "driver"   "$DRIVER_APP_ID"
trigger "merchant" "$MERCHANT_APP_ID"
echo "-- $triggered build(s) déclenché(s). Suivi : https://codemagic.io/apps --"
