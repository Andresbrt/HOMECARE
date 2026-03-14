# ============================================
# SCRIPT DE REINICIO Y VERIFICACIÓN
# ============================================

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  ✅ Instalaciones Completadas" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""

Write-Host "📦 Se han instalado:" -ForegroundColor Cyan
Write-Host "   • Node.js v20.18.0 LTS" -ForegroundColor White
Write-Host "   • Java 23 (Adoptium Temurin)" -ForegroundColor White
Write-Host "   • Dependencias del proyecto Frontend" -ForegroundColor White
Write-Host ""

Write-Host "⚠️  IMPORTANTE:" -ForegroundColor Yellow
Write-Host "Las nuevas versiones NO estarán disponibles en esta ventana" -ForegroundColor Yellow
Write-Host "porque las variables de entorno no se han actualizado." -ForegroundColor Yellow
Write-Host ""

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  📋 PRÓXIMOS PASOS" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Opción 1: Reiniciar PowerShell (RECOMENDADO)" -ForegroundColor Green
Write-Host "────────────────────────────────────────────" -ForegroundColor Gray
Write-Host "1. Cierra esta ventana de PowerShell" -ForegroundColor White
Write-Host "2. Abre una nueva ventana de PowerShell" -ForegroundColor White
Write-Host "3. Ejecuta:" -ForegroundColor White
Write-Host ""
Write-Host "   cd 'C:\Users\PC\Desktop\HOME CARE'" -ForegroundColor Cyan
Write-Host "   .\verify-and-start.ps1" -ForegroundColor Cyan
Write-Host ""
Write-Host ""

Write-Host "Opción 2: Reiniciar el PC" -ForegroundColor Yellow
Write-Host "────────────────────────────────────────────" -ForegroundColor Gray
Write-Host "Si después de reiniciar PowerShell no funcionan las nuevas" -ForegroundColor White
Write-Host "versiones, reinicia tu PC y luego ejecuta:" -ForegroundColor White
Write-Host ""
Write-Host "   cd 'C:\Users\PC\Desktop\HOME CARE'" -ForegroundColor Cyan
Write-Host "   .\start.ps1" -ForegroundColor Cyan
Write-Host ""
Write-Host ""

Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$restart = Read-Host "Deseas que cierre esta ventana ahora? (S/N)"

if ($restart -eq "S" -or $restart -eq "s") {
    Write-Host ""
    Write-Host "Cerrando ventana..." -ForegroundColor Green
    Write-Host "   Abre una nueva ventana de PowerShell para continuar" -ForegroundColor Cyan
    Write-Host ""
    Start-Sleep -Seconds 2
    exit
} else {
    Write-Host ""
    Write-Host "Recuerda cerrar y reabrir PowerShell para usar las nuevas versiones" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "Presiona cualquier tecla para salir..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
