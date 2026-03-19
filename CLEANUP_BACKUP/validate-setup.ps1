#!/usr/bin/env pwsh
# =============================================
# HOMECARE API - VALIDACIÓN POST-IMPLEMENTACIÓN
# Script para verificar que todos los fixes fueron aplicados correctamente
# =============================================

$ErrorActionPreference = "Continue"
$totalChecks = 0
$passedChecks = 0
$failedChecks = 0
$warnings = 0

function Write-CheckResult {
    param(
        [string]$TestName,
        [bool]$Passed,
        [string]$Message = "",
        [bool]$IsWarning = $false
    )
    
    $script:totalChecks++
    
    if ($IsWarning) {
        Write-Host "⚠️  " -ForegroundColor Yellow -NoNewline
        Write-Host "$TestName" -ForegroundColor Yellow
        if ($Message) { Write-Host "   → $Message" -ForegroundColor Gray }
        $script:warnings++
    }
    elseif ($Passed) {
        Write-Host "✅ " -ForegroundColor Green -NoNewline
        Write-Host "$TestName" -ForegroundColor Green
        if ($Message) { Write-Host "   → $Message" -ForegroundColor Gray }
        $script:passedChecks++
    }
    else {
        Write-Host "❌ " -ForegroundColor Red -NoNewline
        Write-Host "$TestName" -ForegroundColor Red
        if ($Message) { Write-Host "   → $Message" -ForegroundColor Gray }
        $script:failedChecks++
    }
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   HOMECARE API - VALIDACIÓN DE SEGURIDAD Y PERFORMANCE    ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# =============================================
# 1. VERIFICAR ARCHIVOS DE CONFIGURACIÓN
# =============================================
Write-Host "📁 1. ARCHIVOS DE CONFIGURACIÓN" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

# Verificar .env existe
$envExists = Test-Path ".env"
Write-CheckResult -TestName "Archivo .env existe" -Passed $envExists -Message "Requerido para variables de entorno"

# Verificar docker-compose.yml
$dockerComposeExists = Test-Path "docker-compose.yml"
Write-CheckResult -TestName "docker-compose.yml presente" -Passed $dockerComposeExists

# Verificar application-production.yml
$prodConfigExists = Test-Path "src/main/resources/application-production.yml"
Write-CheckResult -TestName "application-production.yml creado" -Passed $prodConfigExists

# Verificar script de migración
$migrationExists = Test-Path "src/main/resources/db/migration/V2__add_performance_indexes.sql"
Write-CheckResult -TestName "Script de índices SQL creado" -Passed $migrationExists

Write-Host ""

# =============================================
# 2. VERIFICAR VARIABLES DE ENTORNO CRÍTICAS
# =============================================
Write-Host "🔐 2. VARIABLES DE ENTORNO CRÍTICAS" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

if ($envExists) {
    $envContent = Get-Content ".env" -Raw
    
    # JWT_SECRET
    $jwtSecretPresent = $envContent -match "JWT_SECRET=.{32,}"
    Write-CheckResult -TestName "JWT_SECRET configurado (min 32 chars)" -Passed $jwtSecretPresent
    
    if ($envContent -match "JWT_SECRET=(.+)") {
        $jwtSecret = $matches[1].Trim()
        $isExample = $jwtSecret -match "(your_super_secret|change_me|example)"
        if ($isExample) {
            Write-CheckResult -TestName "JWT_SECRET es único (no ejemplo)" -Passed $false -Message "¡Cambiar value por uno generado!"
        } else {
            $length = $jwtSecret.Length
            if ($length -ge 64) {
                Write-CheckResult -TestName "JWT_SECRET longitud adecuada ($length chars)" -Passed $true
            } else {
                Write-CheckResult -TestName "JWT_SECRET longitud recomendada (64+ chars)" -Passed $false -Message "Actual: $length chars" -IsWarning $true
            }
        }
    }
    
    # CORS
    $corsPresent = $envContent -match "CORS_ALLOWED_ORIGINS=.+"
    Write-CheckResult -TestName "CORS_ALLOWED_ORIGINS configurado" -Passed $corsPresent
    
    if ($envContent -match "CORS_ALLOWED_ORIGINS=(.+)") {
        $corsOrigins = $matches[1].Trim()
        $hasWildcard = $corsOrigins -match "\*"
        if ($hasWildcard) {
            Write-CheckResult -TestName "CORS sin wildcard (*)" -Passed $false -Message "¡Riesgo de seguridad!"
        } else {
            Write-CheckResult -TestName "CORS configurado con lista específica" -Passed $true
        }
    }
    
    # Database
    $dbHostPresent = $envContent -match "DATABASE_HOST=.+"
    Write-CheckResult -TestName "DATABASE_HOST configurado" -Passed $dbHostPresent
    
    $dbPasswordPresent = $envContent -match "DATABASE_PASSWORD=.{8,}"
    Write-CheckResult -TestName "DATABASE_PASSWORD configurado" -Passed $dbPasswordPresent
    
    # Redis
    $redisHostPresent = $envContent -match "REDIS_HOST=.+"
    Write-CheckResult -TestName "REDIS_HOST configurado" -Passed $redisHostPresent
    
    # Wompi
    $wompiPublicPresent = $envContent -match "WOMPI_PUBLIC_KEY=.+"
    Write-CheckResult -TestName "WOMPI_PUBLIC_KEY configurado" -Passed $wompiPublicPresent
    
    # Google Maps
    $googleMapsPresent = $envContent -match "GOOGLE_MAPS_API_KEY=.+"
    Write-CheckResult -TestName "GOOGLE_MAPS_API_KEY configurado" -Passed $googleMapsPresent
    
    # Firebase
    $firebasePresent = $envContent -match "FIREBASE_SERVER_KEY=.+"
    Write-CheckResult -TestName "FIREBASE_SERVER_KEY configurado" -Passed $firebasePresent
    
} else {
    Write-CheckResult -TestName "Saltando verificación de variables" -Passed $false -Message "Archivo .env no existe"
}

Write-Host ""

# =============================================
# 3. VERIFICAR SERVICIOS REQUERIDOS
# =============================================
Write-Host "🐳 3. SERVICIOS Y DEPENDENCIAS" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

# Verificar Docker
try {
    $dockerVersion = docker --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-CheckResult -TestName "Docker instalado" -Passed $true -Message $dockerVersion
    } else {
        Write-CheckResult -TestName "Docker instalado" -Passed $false
    }
} catch {
    Write-CheckResult -TestName "Docker instalado" -Passed $false -Message "No encontrado"
}

# Verificar Docker Compose
try {
    $dockerComposeVersion = docker-compose --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-CheckResult -TestName "Docker Compose instalado" -Passed $true -Message $dockerComposeVersion
    } else {
        Write-CheckResult -TestName "Docker Compose instalado" -Passed $false
    }
} catch {
    Write-CheckResult -TestName "Docker Compose instalado" -Passed $false -Message "No encontrado"
}

# Verificar Java
try {
    $javaVersion = java -version 2>&1 | Select-String "version"
    if ($javaVersion -match "23|21|17") {
        Write-CheckResult -TestName "Java 17+ instalado" -Passed $true -Message $javaVersion
    } else {
        Write-CheckResult -TestName "Java 17+ instalado" -Passed $false -Message "Versión no compatible"
    }
} catch {
    Write-CheckResult -TestName "Java instalado" -Passed $false -Message "No encontrado"
}

# Verificar Maven
try {
    $mavenVersion = mvn --version 2>&1 | Select-String "Apache Maven"
    if ($mavenVersion) {
        Write-CheckResult -TestName "Maven instalado" -Passed $true -Message $mavenVersion
    } else {
        Write-CheckResult -TestName "Maven instalado" -Passed $false
    }
} catch {
    # Intentar Maven Wrapper
    if (Test-Path "mvnw.cmd") {
        Write-CheckResult -TestName "Maven Wrapper presente" -Passed $true -Message "mvnw.cmd encontrado"
    } else {
        Write-CheckResult -TestName "Maven instalado" -Passed $false -Message "Ni Maven ni mvnw encontrados"
    }
}

Write-Host ""

# =============================================
# 4. VERIFICAR SERVICIOS EN DOCKER
# =============================================
Write-Host "🔌 4. ESTADO DE SERVICIOS (si están corriendo)" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

try {
    $dockerRunning = docker ps 2>&1
    if ($LASTEXITCODE -eq 0) {
        
        # PostgreSQL
        $postgresRunning = $dockerRunning | Select-String "homecare-postgres|postgis"
        if ($postgresRunning) {
            Write-CheckResult -TestName "PostgreSQL container corriendo" -Passed $true
        } else {
            Write-CheckResult -TestName "PostgreSQL container corriendo" -Passed $false -Message "No detectado" -IsWarning $true
        }
        
        # Redis
        $redisRunning = $dockerRunning | Select-String "homecare-redis|redis"
        if ($redisRunning) {
            Write-CheckResult -TestName "Redis container corriendo" -Passed $true
        } else {
            Write-CheckResult -TestName "Redis container corriendo" -Passed $false -Message "No detectado" -IsWarning $true
        }
        
    } else {
        Write-CheckResult -TestName "Docker daemon corriendo" -Passed $false -Message "Docker no está activo"
    }
} catch {
    Write-CheckResult -TestName "Verificación de containers" -Passed $false -Message "No se pudo ejecutar docker ps" -IsWarning $true
}

Write-Host ""

# =============================================
# 5. VERIFICAR ESTRUCTURA DEL PROYECTO
# =============================================
Write-Host "📦 5. ESTRUCTURA DEL PROYECTO" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

$requiredFiles = @(
    "pom.xml",
    "src/main/java/com/homecare/HomeCareApplication.java",
    "src/main/java/com/homecare/config/SecurityConfig.java",
    "src/main/java/com/homecare/security/JwtTokenProvider.java",
    "src/main/resources/application.yml",
    "README.md"
)

foreach ($file in $requiredFiles) {
    $exists = Test-Path $file
    $fileName = Split-Path $file -Leaf
    Write-CheckResult -TestName "$fileName presente" -Passed $exists
}

Write-Host ""

# =============================================
# 6. VERIFICAR DEPENDENCIAS CRÍTICAS EN POM.XML
# =============================================
Write-Host "📚 6. DEPENDENCIAS CRÍTICAS" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

if (Test-Path "pom.xml") {
    $pomContent = Get-Content "pom.xml" -Raw
    
    # Spring Boot 3.5
    $springBoot35 = $pomContent -match "spring-boot-starter-parent.*3\.5"
    Write-CheckResult -TestName "Spring Boot 3.5.x" -Passed $springBoot35
    
    # JWT
    $jwtPresent = $pomContent -match "io.jsonwebtoken"
    Write-CheckResult -TestName "JWT (io.jsonwebtoken)" -Passed $jwtPresent
    
    # Redis
    $redisPresent = $pomContent -match "spring-boot-starter-data-redis"
    Write-CheckResult -TestName "Spring Data Redis" -Passed $redisPresent
    
    # PostgreSQL
    $postgresqlPresent = $pomContent -match "postgresql"
    Write-CheckResult -TestName "PostgreSQL driver" -Passed $postgresqlPresent
    
    # Actuator
    $actuatorPresent = $pomContent -match "spring-boot-starter-actuator"
    Write-CheckResult -TestName "Spring Boot Actuator" -Passed $actuatorPresent
    
    # Security
    $securityPresent = $pomContent -match "spring-boot-starter-security"
    Write-CheckResult -TestName "Spring Security" -Passed $securityPresent
    
} else {
    Write-CheckResult -TestName "pom.xml no encontrado" -Passed $false
}

Write-Host ""

# =============================================
# RESUMEN FINAL
# =============================================
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                     RESUMEN FINAL                          ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Write-Host "Total de checks: " -NoNewline
Write-Host "$totalChecks" -ForegroundColor White

Write-Host "✅ Pasados: " -NoNewline -ForegroundColor Green
Write-Host "$passedChecks" -ForegroundColor Green

Write-Host "❌ Fallados: " -NoNewline -ForegroundColor Red
Write-Host "$failedChecks" -ForegroundColor Red

Write-Host "⚠️  Advertencias: " -NoNewline -ForegroundColor Yellow
Write-Host "$warnings" -ForegroundColor Yellow

$percentage = [math]::Round(($passedChecks / $totalChecks) * 100, 1)
Write-Host "Porcentaje de éxito: " -NoNewline
if ($percentage -ge 90) {
    Write-Host "$percentage%" -ForegroundColor Green
} elseif ($percentage -ge 70) {
    Write-Host "$percentage%" -ForegroundColor Yellow
} else {
    Write-Host "$percentage%" -ForegroundColor Red
}

Write-Host ""

if ($percentage -ge 90) {
    Write-Host "🎉 ¡Excelente! Tu configuración está lista para producción." -ForegroundColor Green
} elseif ($percentage -ge 70) {
    Write-Host "⚠️  Atención: Hay algunos problemas que debes resolver." -ForegroundColor Yellow
} else {
    Write-Host "❌ CRÍTICO: Hay problemas importantes que deben ser corregidos antes de desplegar." -ForegroundColor Red
}

Write-Host ""
Write-Host "📋 Para más detalles, consulta:" -ForegroundColor Cyan
Write-Host "   - BACKEND_AUDIT_REPORT_2026.md" -ForegroundColor Gray
Write-Host "   - QUICK_FIXES_GUIDE.md" -ForegroundColor Gray
Write-Host "   - README.md" -ForegroundColor Gray
Write-Host ""

# Código de salida
if ($failedChecks -gt 5) {
    exit 1
} else {
    exit 0
}
