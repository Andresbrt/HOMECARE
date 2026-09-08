#!/usr/bin/env bash
# ==============================================================================
# HOMECARE - Verificación y Siembra de Cuentas Demo
# ==============================================================================
set -e

BACKEND_URL="${BACKEND_URL:-https://homecare-backend.fly.dev}"

echo "🔍 Verificando salud del backend en $BACKEND_URL..."
HEALTH=$(curl -s "$BACKEND_URL/actuator/health" || echo '{"status":"DOWN"}')
echo "Salud del backend: $HEALTH"

echo ""
echo "🔑 Verificando login de Cliente (usuario@test.com)..."
CUSTOMER_LOGIN=$(curl -s -X POST "$BACKEND_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@test.com","password":"Test123!"}')

if echo "$CUSTOMER_LOGIN" | grep -q "token"; then
  echo "✅ Cliente autenticado exitosamente!"
else
  echo "⚠️ Error autenticando cliente: $CUSTOMER_LOGIN"
fi

echo ""
echo "🔑 Verificando login de Profesional (profesional.demo@test.com)..."
PRO_LOGIN=$(curl -s -X POST "$BACKEND_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"profesional.demo@test.com","password":"Test123!"}')

if echo "$PRO_LOGIN" | grep -q "token"; then
  echo "✅ Profesional autenticado exitosamente!"
else
  echo "⚠️ Error autenticando profesional: $PRO_LOGIN"
fi

echo ""
echo "🚀 Cuentas listas para el botón DEV en la App Móvil."
