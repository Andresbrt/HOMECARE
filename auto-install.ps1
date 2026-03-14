# ============================================
# Script de Instalación Automática - HomeCare
# ============================================

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  HomeCare - Instalación Automática" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Crear directorio temporal
$tempDir = "$env:TEMP\homecare-install"
if (!(Test-Path $tempDir)) {
    New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
}

Write-Host "📁 Directorio temporal: $tempDir" -ForegroundColor Gray
Write-Host ""

# ============================================
# 1. INSTALAR NODE.JS v20 LTS
# ============================================

Write-Host "============================================" -ForegroundColor Yellow
Write-Host "📦 Node.js v20 LTS" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Yellow
Write-Host ""

$nodeVersion = $null
try {
    $nodeVersion = node --version 2>&1
    Write-Host "✅ Node.js ya instalado: $nodeVersion" -ForegroundColor Green
    
    if ($nodeVersion -match "v20\.") {
        Write-Host "✅ Ya tienes Node v20 LTS - Perfecto!" -ForegroundColor Green
        $installNode = $false
    } else {
        Write-Host "⚠️  Tienes $nodeVersion pero necesitas Node v20 LTS" -ForegroundColor Yellow
        $response = Read-Host "¿Deseas instalar Node v20 LTS? (S/N)"
        $installNode = ($response -eq "S" -or $response -eq "s")
    }
} catch {
    Write-Host "❌ Node.js no está instalado" -ForegroundColor Red
    $installNode = $true
}

if ($installNode) {
    Write-Host ""
    Write-Host "⬇️  Descargando Node.js v20.18.0 LTS..." -ForegroundColor Cyan
    
    $nodeUrl = "https://nodejs.org/dist/v20.18.0/node-v20.18.0-x64.msi"
    $nodeInstaller = "$tempDir\nodejs-installer.msi"
    
    try {
        # Descargar
        Write-Host "   Descargando desde: $nodeUrl" -ForegroundColor Gray
        Invoke-WebRequest -Uri $nodeUrl -OutFile $nodeInstaller -UseBasicParsing
        Write-Host "✅ Descarga completada" -ForegroundColor Green
        
        # Instalar
        Write-Host ""
        Write-Host "📦 Instalando Node.js v20.18.0..." -ForegroundColor Cyan
        Write-Host "   (Esto puede tardar 2-3 minutos)" -ForegroundColor Gray
        
        Start-Process msiexec.exe -ArgumentList "/i `"$nodeInstaller`" /quiet /norestart" -Wait
        
        Write-Host "✅ Node.js instalado correctamente" -ForegroundColor Green
        Write-Host "⚠️  IMPORTANTE: Necesitas cerrar y reabrir PowerShell para usar Node" -ForegroundColor Yellow
        
    } catch {
        Write-Host "❌ Error al descargar/instalar Node.js: $_" -ForegroundColor Red
        Write-Host "   Descarga manual: https://nodejs.org/en/download" -ForegroundColor Yellow
    }
}

Write-Host ""

# ============================================
# 2. INSTALAR JAVA 23
# ============================================

Write-Host "============================================" -ForegroundColor Yellow
Write-Host "☕ Java 23 (Adoptium Temurin)" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Yellow
Write-Host ""

$javaVersion = $null
try {
    $javaVersion = java -version 2>&1 | Select-String "version" | Select-Object -First 1
    Write-Host "✅ Java ya instalado: $javaVersion" -ForegroundColor Green
    
    if ($javaVersion -match '23\.') {
        Write-Host "✅ Ya tienes Java 23 - Perfecto!" -ForegroundColor Green
        $installJava = $false
    } else {
        Write-Host "⚠️  Necesitas Java 23 para el backend" -ForegroundColor Yellow
        $response = Read-Host "¿Deseas instalar Java 23? (S/N)"
        $installJava = ($response -eq "S" -or $response -eq "s")
    }
} catch {
    Write-Host "❌ Java no está instalado" -ForegroundColor Red
    $installJava = $true
}

if ($installJava) {
    Write-Host ""
    Write-Host "⬇️  Descargando Java 23 (Adoptium Temurin)..." -ForegroundColor Cyan
    
    # URL del instalador MSI de Java 23
    $javaUrl = "https://github.com/adoptium/temurin23-binaries/releases/download/jdk-23.0.1%2B11/OpenJDK23U-jdk_x64_windows_hotspot_23.0.1_11.msi"
    $javaInstaller = "$tempDir\java23-installer.msi"
    
    try {
        # Descargar
        Write-Host "   Descargando desde GitHub (Adoptium)..." -ForegroundColor Gray
        Write-Host "   Tamaño: ~190MB - Esto puede tardar varios minutos" -ForegroundColor Gray
        
        Invoke-WebRequest -Uri $javaUrl -OutFile $javaInstaller -UseBasicParsing
        Write-Host "✅ Descarga completada" -ForegroundColor Green
        
        # Instalar
        Write-Host ""
        Write-Host "📦 Instalando Java 23..." -ForegroundColor Cyan
        Write-Host "   (Esto puede tardar 3-5 minutos)" -ForegroundColor Gray
        
        # Instalar con JAVA_HOME y PATH configurados
        Start-Process msiexec.exe -ArgumentList "/i `"$javaInstaller`" ADDLOCAL=FeatureMain,FeatureEnvironment,FeatureJarFileRunWith,FeatureJavaHome /quiet /norestart" -Wait
        
        Write-Host "✅ Java 23 instalado correctamente" -ForegroundColor Green
        Write-Host "⚠️  IMPORTANTE: Necesitas cerrar y reabrir PowerShell para usar Java 23" -ForegroundColor Yellow
        
    } catch {
        Write-Host "❌ Error al descargar/instalar Java 23: $_" -ForegroundColor Red
        Write-Host "   Descarga manual: https://adoptium.net/temurin/releases/?version=23" -ForegroundColor Yellow
    }
}

Write-Host ""

# ============================================
# 3. VERIFICAR INSTALACIONES
# ============================================

Write-Host "============================================" -ForegroundColor Yellow
Write-Host "✅ Verificación de Herramientas" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Yellow
Write-Host ""

$needsRestart = $false

# Verificar Node
try {
    $nodeCheck = node --version 2>&1
    Write-Host "✅ Node.js: $nodeCheck" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Node.js: No detectado (necesitas reiniciar PowerShell)" -ForegroundColor Yellow
    $needsRestart = $true
}

# Verificar npm
try {
    $npmCheck = npm --version 2>&1
    Write-Host "✅ npm: v$npmCheck" -ForegroundColor Green
} catch {
    Write-Host "⚠️  npm: No detectado (necesitas reiniciar PowerShell)" -ForegroundColor Yellow
    $needsRestart = $true
}

# Verificar Java
try {
    $javaCheck = java -version 2>&1 | Select-String "version" | Select-Object -First 1
    Write-Host "✅ Java: $javaCheck" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Java: No detectado (necesitas reiniciar PowerShell)" -ForegroundColor Yellow
    $needsRestart = $true
}

Write-Host ""

# ============================================
# 4. CONFIGURAR PROYECTO
# ============================================

if (!$needsRestart) {
    Write-Host "============================================" -ForegroundColor Yellow
    Write-Host "📦 Configuración del Proyecto" -ForegroundColor Yellow
    Write-Host "============================================" -ForegroundColor Yellow
    Write-Host ""
    
    $setupProject = Read-Host "¿Deseas instalar las dependencias del proyecto ahora? (S/N)"
    
    if ($setupProject -eq "S" -or $setupProject -eq "s") {
        # Instalar dependencias del frontend
        Write-Host ""
        Write-Host "📦 Instalando dependencias del Frontend..." -ForegroundColor Cyan
        Write-Host "   (Esto puede tardar 3-5 minutos)" -ForegroundColor Gray
        
        Set-Location "C:\Users\PC\Desktop\HOME CARE\frontend"
        
        # Limpiar instalación anterior
        Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
        Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
        Remove-Item -Recurse -Force .expo -ErrorAction SilentlyContinue
        
        # Instalar dependencias
        npm install --legacy-peer-deps
        
        Write-Host "✅ Dependencias del frontend instaladas" -ForegroundColor Green
        Write-Host ""
        
        Write-Host "============================================" -ForegroundColor Green
        Write-Host "  ✅ INSTALACIÓN COMPLETADA" -ForegroundColor Green
        Write-Host "============================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "🚀 Para iniciar el proyecto, ejecuta:" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "   .\start.ps1" -ForegroundColor White
        Write-Host ""
        Write-Host "O manualmente:" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "   Backend:  java -jar backend\target\homecare-backend-1.0.0.jar" -ForegroundColor White
        Write-Host "   Frontend: cd frontend ; npm start" -ForegroundColor White
        Write-Host ""
    }
}

# ============================================
# LIMPIEZA
# ============================================

Write-Host ""
Write-Host "🧹 Limpiando archivos temporales..." -ForegroundColor Gray
Remove-Item -Recurse -Force $tempDir -ErrorAction SilentlyContinue

if ($needsRestart) {
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Yellow
    Write-Host "  ⚠️  ACCIÓN REQUERIDA" -ForegroundColor Yellow
    Write-Host "============================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Por favor:" -ForegroundColor Yellow
    Write-Host "1. Cierra esta ventana de PowerShell" -ForegroundColor White
    Write-Host "2. Abre una nueva ventana de PowerShell" -ForegroundColor White
    Write-Host "3. Ejecuta este script nuevamente:" -ForegroundColor White
    Write-Host ""
    Write-Host "   cd 'C:\Users\PC\Desktop\HOME CARE'" -ForegroundColor Cyan
    Write-Host "   .\auto-install.ps1" -ForegroundColor Cyan
    Write-Host ""
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Presiona cualquier tecla para salir..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
