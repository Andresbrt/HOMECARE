#!/usr/bin/env bash
# ==============================================================================
# HOMECARE - Script de Lanzamiento Rápido para DEMO
# ==============================================================================
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_URL="https://homecare-backend.fly.dev"

echo "========================================================"
echo "      🚀 INICIANDO ENTORNO DE DEMO HOMECARE 2026       "
echo "========================================================"

# 1. Comprobar conectividad con backend Fly.io
echo "1️⃣  Verificando conexión con el backend ($BACKEND_URL)..."
HEALTH_STATUS=$(curl -s -m 6 "$BACKEND_URL/actuator/health" | grep -o '"status":"UP"' || true)

if [ -n "$HEALTH_STATUS" ]; then
  echo "   ✅ Backend en la nube OPERATIVO (Status: UP)"
else
  echo "   ⚠️ Advertencia: El backend no respondió 'UP' de inmediato. Reintentando..."
  sleep 2
fi

# 2. Comprobar cuentas DEV
echo "2️⃣  Verificando credenciales de prueba para botones rápidos..."
CUST_CHECK=$(curl -s -X POST "$BACKEND_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@test.com","password":"Test123!"}' | grep -o '"token"' || true)

PRO_CHECK=$(curl -s -X POST "$BACKEND_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"profesional.demo@test.com","password":"Test123!"}' | grep -o '"token"' || true)

if [ -n "$CUST_CHECK" ] && [ -n "$PRO_CHECK" ]; then
  echo "   ✅ Cuentas de prueba listas para acceso inmediato:"
  echo "      - Cliente:     usuario@test.com          (Botón '👤 Usuario')"
  echo "      - Profesional: profesional.demo@test.com (Botón '👷 Profesional')"
else
  echo "   ⚠️ Sembrando cuentas demo..."
  bash "$DIR/scripts/seed_demo_accounts.sh"
fi

# 3. Lanzar Expo Metro Bundler limpio
echo "3️⃣  Iniciando Metro Bundler para móvil..."
cd "$DIR/mobile"

echo ""
echo "📱 Escanea el código QR con Expo Go en tus 2 dispositivos o presiona 'i'/'a' para simulador."
echo "📄 Consulta DEMO_RUNBOOK.md para ver el guión de presentación de 3 minutos."
echo "========================================================"
echo ""

npx expo start -c
