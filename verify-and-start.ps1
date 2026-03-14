# ============================================
# Script de Verificación y Arranque
# ============================================

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  HomeCare - Verificación y Arranque" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# ============================================
# VERIFICAR INSTALACIONES
# ============================================

Write-Host "🔍 Verificando herramientas instaladas..." -ForegroundColor Yellow
Write-Host ""

$allOk = $true

# Node.js
Write-Host "  Node.js: " -NoNewline -ForegroundColor Cyan
try {
    $nodeVersion = node --version
    if ($nodeVersion -match "v20\.") {
        Write-Host "✅ $nodeVersion (LTS)" -ForegroundColor Green
        $nodeOk = $true
    } elseif ($nodeVersion -match "v\d+\.") {
        Write-Host "⚠️  $nodeVersion (Se recomienda v20 LTS)" -ForegroundColor Yellow
        $nodeOk = $true
    } else {
        Write-Host "❌ Versión desconocida" -ForegroundColor Red
        $nodeOk = $false
        $allOk = $false
    }
} catch {
    Write-Host "❌ No instalado" -ForegroundColor Red
    $nodeOk = $false
    $allOk = $false
}

# npm
Write-Host "  npm:     " -NoNewline -ForegroundColor Cyan
try {
    $npmVersion = npm --version
    Write-Host "✅ v$npmVersion" -ForegroundColor Green
    $npmOk = $true
} catch {
    Write-Host "❌ No instalado" -ForegroundColor Red
    $npmOk = $false
    $allOk = $false
}

# Java
Write-Host "  Java:    " -NoNewline -ForegroundColor Cyan
try {
    $javaVersionFull = java -version 2>&1 | Select-String "version" | Select-Object -First 1
    $javaVersionNum = $javaVersionFull.ToString() -replace '.*"(\d+)\..*', '$1'
    
    if ($javaVersionFull -match '23\.') {
        Write-Host "✅ Java 23" -ForegroundColor Green
        $javaOk = $true
    } elseif ($javaVersionNum -ge 17) {
        Write-Host "⚠️  Java $javaVersionNum (Se recomienda Java 23)" -ForegroundColor Yellow
        $javaOk = $true
    } else {
        Write-Host "❌ Java $javaVersionNum (muy antiguo)" -ForegroundColor Red
        $javaOk = $false
        $allOk = $false
    }
} catch {
    Write-Host "❌ No instalado" -ForegroundColor Red
    $javaOk = $false
    $allOk = $false
}

Write-Host ""

# ============================================  
# RESULTADOS
# ============================================

if ($allOk) {
    Write-Host "✅ Todas las herramientas están instaladas correctamente" -ForegroundColor Green
} else {
    Write-Host "⚠️  Algunas herramientas no están disponibles" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Posibles soluciones:" -ForegroundColor Cyan
    Write-Host "  1. Reinicia tu PC" -ForegroundColor White
    Write-Host "  2. Verifica que las instalaciones se completaron" -ForegroundColor White
    Write-Host "  3. Revisa INSTALL_GUIDE.md para instalación manual" -ForegroundColor White
    Write-Host ""
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  🚀 Opciones de Inicio" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

if ($nodeOk -and $npmOk) {
    Write-Host "  [1] 📱 Frontend (Expo)" -ForegroundColor Green
} else {
    Write-Host "  [1] 📱 Frontend (Expo) - ❌ No disponible" -ForegroundColor Red
}

if ($javaOk) {
    Write-Host "  [2] ☕ Backend (Spring Boot)" -ForegroundColor Green
} else {
    Write-Host "  [2] ☕ Backend (Spring Boot) - ❌ No disponible" -ForegroundColor Red
}

if ($nodeOk -and $npmOk -and $javaOk) {
    Write-Host "  [3] 🚀 Ambos (Frontend + Backend)" -ForegroundColor Green
} else {
    Write-Host "  [3] 🚀 Ambos (Frontend + Backend) - ❌ No disponible" -ForegroundColor Red
}

Write-Host "  [4] 🔧 Solo verificar" -ForegroundColor White
Write-Host "  [5] ❌ Salir" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Selecciona una opción (1-5)"

Write-Host ""

switch ($choice) {
    "1" {
        if ($nodeOk -and $npmOk) {
            Write-Host "🚀 Iniciando Frontend..." -ForegroundColor Green
            Write-Host ""
            Set-Location "C:\Users\PC\Desktop\HOME CARE\frontend"
            
            Write-Host "📍 URL: http://localhost:19000" -ForegroundColor Cyan
            Write-Host ""
            Write-Host "Opciones al iniciar:" -ForegroundColor Yellow
            Write-Host "  • Presiona 'w' para abrir en navegador web" -ForegroundColor White
            Write-Host "  • Escanea el QR con Expo Go en tu teléfono" -ForegroundColor White
            Write-Host "  • Presiona 'a' para Android emulator" -ForegroundColor White
            Write-Host "  • Presiona 'Ctrl+C' para detener" -ForegroundColor White
            Write-Host ""
            
            npm start
        } else {
            Write-Host "❌ Node.js/npm no están disponibles" -ForegroundColor Red
        }
    }
    "2" {
        if ($javaOk) {
            Write-Host "🚀 Iniciando Backend..." -ForegroundColor Green
            Write-Host ""
            Set-Location "C:\Users\PC\Desktop\HOME CARE\backend"
            
            Write-Host "📍 API: http://localhost:8080" -ForegroundColor Cyan
            Write-Host "📍 Swagger UI: http://localhost:8080/swagger-ui.html" -ForegroundColor Cyan
            Write-Host "📍 Health: http://localhost:8080/actuator/health" -ForegroundColor Cyan
            Write-Host ""
            Write-Host "Presiona Ctrl+C para detener" -ForegroundColor White
            Write-Host ""
            
            java -jar target\homecare-backend-1.0.0.jar
        } else {
            Write-Host "❌ Java no está disponible" -ForegroundColor Red
        }
    }
    "3" {
        if ($nodeOk -and $npmOk -and $javaOk) {
            Write-Host "🚀 Iniciando Backend y Frontend..." -ForegroundColor Green
            Write-Host ""
            Write-Host "📍 Backend: http://localhost:8080" -ForegroundColor Cyan
            Write-Host "📍 Frontend: http://localhost:19000" -ForegroundColor Cyan
            Write-Host ""
            
            # Iniciar backend en nueva ventana
            Write-Host "⏳ Iniciando Backend en nueva ventana..." -ForegroundColor Yellow
            Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\PC\Desktop\HOME CARE\backend'; Write-Host '🚀 Backend iniciando...' -ForegroundColor Green; Write-Host 'API: http://localhost:8080' -ForegroundColor Cyan; Write-Host ''; java -jar target\homecare-backend-1.0.0.jar"
            
            Start-Sleep -Seconds 3
            
            # Iniciar frontend en ventana actual
            Write-Host "⏳ Iniciando Frontend..." -ForegroundColor Yellow
            Set-Location "C:\Users\PC\Desktop\HOME CARE\frontend"
            Write-Host ""
            
            npm start
        } else {
            Write-Host "❌ Algunas herramientas no están disponibles" -ForegroundColor Red
        }
    }
    "4" {
        Write-Host "✅ Verificación completada" -ForegroundColor Green
    }
    "5" {
        Write-Host "👋 Hasta luego" -ForegroundColor Cyan
        exit
    }
    default {
        Write-Host "❌ Opción inválida" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
