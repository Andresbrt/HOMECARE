#!/usr/bin/env bash
# ==============================================================================
# HOMECARE - Verificación y Siembra de Cuentas Demo
# ==============================================================================
set -e

BACKEND_URL="${BACKEND_URL:-http://localhost:8080}"
CUSTOMER_EMAIL="${CUSTOMER_EMAIL:-usuario@test.com}"
CUSTOMER_PASSWORD="${CUSTOMER_PASSWORD:-Test123!}"
PRO_EMAIL="${PRO_EMAIL:-profesional.demo@test.com}"
PRO_PASSWORD="${PRO_PASSWORD:-Test123!}"

if [[ "$BACKEND_URL" == *"fly.dev"* || "$BACKEND_URL" == *"homecare.works"* ]]; then
  echo "⚠️ ALERTA DE SEGURIDAD: Estás ejecutando contra un entorno remoto ($BACKEND_URL)."
  if [ "${FORCE_REMOTE_SEED:-false}" != "true" ]; then
    echo "❌ Operación abortada por seguridad. Para ejecutar en producción/staging exporta FORCE_REMOTE_SEED=true."
    exit 1
  fi
fi

echo "🔍 Verificando salud del backend en $BACKEND_URL..."
HEALTH=$(curl -s "$BACKEND_URL/actuator/health" || echo '{"status":"DOWN"}')
echo "Salud del backend: $HEALTH"

echo ""
echo "🔑 Verificando login de Cliente ($CUSTOMER_EMAIL)..."
CUSTOMER_LOGIN=$(curl -s -X POST "$BACKEND_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$CUSTOMER_EMAIL\",\"password\":\"$CUSTOMER_PASSWORD\"}")

if echo "$CUSTOMER_LOGIN" | grep -q "token"; then
  echo "✅ Cliente autenticado exitosamente!"
else
  echo "⚠️ Error autenticando cliente: $CUSTOMER_LOGIN"
fi

echo ""
echo "🔑 Verificando login de Profesional ($PRO_EMAIL)..."
PRO_LOGIN=$(curl -s -X POST "$BACKEND_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$PRO_EMAIL\",\"password\":\"$PRO_PASSWORD\"}")

if echo "$PRO_LOGIN" | grep -q "token"; then
  echo "✅ Profesional autenticado exitosamente!"
else
  echo "⚠️ Error autenticando profesional: $PRO_LOGIN"
fi

echo ""
echo "🚀 Verificación completada para $BACKEND_URL."

