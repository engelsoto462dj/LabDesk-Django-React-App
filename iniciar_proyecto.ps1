# ==============================================================================
# SENATI - Script de inicio rápido del proyecto LabDesk
# Lanza automáticamente el Backend Django y el Frontend React en 2 terminales
# ==============================================================================

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   SENATI - LabDesk: Gestion de Incidencias de Computo" -ForegroundColor Green
Write-Host "   V Semestre - Desarrollo de Software" -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Cyan

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path

# 1. Iniciar Backend Django en terminal A
Write-Host " [+] Lanzando Backend Django en http://127.0.0.1:8000/api/incidencias/..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$scriptPath\backend'; & '.\.venv\Scripts\Activate.ps1'; Write-Host '--- TERMINAL A: DJANGO REST FRAMEWORK (PUERTO 8000) ---' -ForegroundColor Green; python manage.py runserver"

Start-Sleep -Seconds 2

# 2. Iniciar Frontend React en terminal B
Write-Host " [+] Lanzando Frontend React en http://127.0.0.1:5173/..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$scriptPath\frontend'; Write-Host '--- TERMINAL B: REACT + VITE (PUERTO 5173) ---' -ForegroundColor Cyan; npm run dev"

Write-Host "`nListo crack! Ambos procesos estan encendidos." -ForegroundColor Green
Write-Host "Abre tu navegador en: http://127.0.0.1:5173" -ForegroundColor White
