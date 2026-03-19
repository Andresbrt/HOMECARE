# 🚀 Script de Inicio Rápido - HomeCare
# Ejecuta este script DESPUÉS de instalar Java 23 y Node v20

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  HomeCare - Verificación e Inicio" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Verificar Java
Write-Host "📌 Verificando Java..." -ForegroundColor Yellow
try {
    $javaVersion = java -version 2>&1 | Select-String "version" | Select-Object -First 1
    Write-Host "✅ Java instalado: $javaVersion" -ForegroundColor Green
    
    # Verificar si es Java 23
    if ($javaVersion -match "23\.") {
        Write-Host "✅ Java 23 detectado - Backend compatible" -ForegroundColor Green
        $javaOk = $true
    } else {
        Write-Host "⚠️  Advertencia: Se requiere Java 23 para el backend" -ForegroundColor Red
        Write-Host "   Descarga: https://adoptium.net/temurin/releases/?version=23" -ForegroundColor Yellow
        $javaOk = $false
    }
} catch {
    Write-Host "❌ Java no encontrado" -ForegroundColor Red
    Write-Host "   Descarga: https://adoptium.net/temurin/releases/?version=23" -ForegroundColor Yellow
    $javaOk = $false
}

Write-Host ""

# Verificar Node.js
Write-Host "📌 Verificando Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js instalado: $nodeVersion" -ForegroundColor Green
    
    # Verificar si es Node v20
    if ($nodeVersion -match "v20\.") {
        Write-Host "✅ Node v20 LTS detectado - Frontend compatible" -ForegroundColor Green
        $nodeOk = $true
    } else {
        Write-Host "⚠️  Advertencia: Se recomienda Node v20 LTS para el frontend" -ForegroundColor Red
        Write-Host "   Tu versión actual puede causar errores con Expo" -ForegroundColor Yellow
        Write-Host "   Descarga: https://nodejs.org/en/download" -ForegroundColor Yellow
        $nodeOk = $false
    }
} catch {
    Write-Host "❌ Node.js no encontrado" -ForegroundColor Red
    Write-Host "   Descarga: https://nodejs.org/en/download" -ForegroundColor Yellow
    $nodeOk = $false
}

Write-Host ""

# Verificar npm
Write-Host "📌 Verificando npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "✅ npm instalado: v$npmVersion" -ForegroundColor Green
    $npmOk = $true
} catch {
    Write-Host "❌ npm no encontrado" -ForegroundColor Red
    $npmOk = $false
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Preguntar qué quiere iniciar
if ($javaOk -and $nodeOk -and $npmOk) {
    Write-Host "✅ Todas las herramientas están instaladas correctamente" -ForegroundColor Green
    Write-Host ""
    Write-Host "¿Qué deseas iniciar?" -ForegroundColor Cyan
    Write-Host "  [1] Backend (Spring Boot - Puerto 8080)" -ForegroundColor White
    Write-Host "  [2] Frontend (Expo - Puerto 19000/19006)" -ForegroundColor White
    Write-Host "  [3] Ambos (Backend + Frontend)" -ForegroundColor White
    Write-Host "  [4] Solo verificar (no iniciar nada)" -ForegroundColor White
    Write-Host ""
    
    $choice = Read-Host "Selecciona una opción (1-4)"
    
    switch ($choice) {
        "1" {
            Write-Host ""
            Write-Host "🚀 Iniciando Backend..." -ForegroundColor Green
            Write-Host "📍 URL: http://localhost:8080" -ForegroundColor Cyan
            Write-Host ""
            Set-Location "C:\Users\PC\Desktop\HOME CARE\backend"
            java -jar target\homecare-backend-1.0.0.jar
        }
        "2" {
            Write-Host ""
            Write-Host "🚀 Iniciando Frontend..." -ForegroundColor Green
            Write-Host "📍 Expo DevTools: http://localhost:19000" -ForegroundColor Cyan
            Write-Host ""
            Write-Host "⏳ Verificando dependencias..." -ForegroundColor Yellow
            Set-Location "C:\Users\PC\Desktop\HOME CARE\frontend"
            
            if (!(Test-Path "node_modules")) {
                Write-Host "📦 Instalando dependencias (esto puede tardar unos minutos)..." -ForegroundColor Yellow
                npm install --legacy-peer-deps
            }
            
            Write-Host ""
            Write-Host "🎯 Iniciando Expo..." -ForegroundColor Green
            Write-Host "   - Presiona 'w' para abrir en navegador web" -ForegroundColor Cyan
            Write-Host "   - Escanea el QR con la app Expo Go en tu teléfono" -ForegroundColor Cyan
            Write-Host "   - Presiona 'a' para Android emulator" -ForegroundColor Cyan
            Write-Host "   - Presiona 'i' para iOS simulator (Mac only)" -ForegroundColor Cyan
            Write-Host ""
            npm start
        }
        "3" {
            Write-Host ""
            Write-Host "🚀 Iniciando Backend y Frontend..." -ForegroundColor Green
            Write-Host ""
            Write-Host "⚠️  Nota: Ambos servicios se ejecutarán en terminales separadas" -ForegroundColor Yellow
            Write-Host "   - Backend: http://localhost:8080" -ForegroundColor Cyan
            Write-Host "   - Frontend: http://localhost:19000" -ForegroundColor Cyan
            Write-Host ""
            
            # Iniciar backend en nueva ventana
            Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\PC\Desktop\HOME CARE\backend'; Write-Host '🚀 Backend iniciando...' -ForegroundColor Green; java -jar target\homecare-backend-1.0.0.jar"
            
            Start-Sleep -Seconds 2
            
            # Iniciar frontend en ventana actual
            Write-Host "⏳ Verificando dependencias del frontend..." -ForegroundColor Yellow
            Set-Location "C:\Users\PC\Desktop\HOME CARE\frontend"
            
            if (!(Test-Path "node_modules")) {
                Write-Host "📦 Instalando dependencias..." -ForegroundColor Yellow
                npm install --legacy-peer-deps
            }
            
            Write-Host ""
            Write-Host "🎯 Iniciando Expo..." -ForegroundColor Green
            npm start
        }
        "4" {
            Write-Host ""
            Write-Host "✅ Verificación completa. No se inició ningún servicio." -ForegroundColor Green
        }
        default {
            Write-Host ""
            Write-Host "❌ Opción inválida" -ForegroundColor Red
        }
    }
} elseif ($javaOk) {
    Write-Host "⚠️  Solo puedes iniciar el Backend (Node.js no está listo)" -ForegroundColor Yellow
    Write-Host ""
    $startBackend = Read-Host "¿Deseas iniciar el Backend? (S/N)"
    
    if ($startBackend -eq "S" -or $startBackend -eq "s") {
        Write-Host ""
        Write-Host "🚀 Iniciando Backend..." -ForegroundColor Green
        Set-Location "C:\Users\PC\Desktop\HOME CARE\backend"
        java -jar target\homecare-backend-1.0.0.jar
    }
} else {
    Write-Host "❌ Por favor instala las herramientas faltantes antes de continuar" -ForegroundColor Red
    Write-Host ""
    Write-Host "📖 Consulta INSTALL_GUIDE.md para instrucciones detalladas" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
