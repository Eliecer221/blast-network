# Self-elevate to Administrator if not already admin
if (!([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Start-Process powershell.exe "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
    exit
}

# --- Script Running as Admin below ---
$domain = "blast-network.blast"
$ip = "127.0.0.1"
$hostsFile = "$env:windir\System32\drivers\etc\hosts"

Clear-Host
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   CONFIGURANDO DOMINIO BLAST NETWORK" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Escaneando archivo hosts..." -ForegroundColor Yellow

try {
    if (-not (Test-Path $hostsFile)) {
        Write-Host "Creando archivo hosts..."
        New-Item -Path $hostsFile -ItemType File -Force
    }

    $content = Get-Content $hostsFile -Raw
    if ($content -match ([regex]::Escape($domain))) {
        Write-Host "✅ El dominio $domain ya estaba configurado." -ForegroundColor Green
    }
    else {
        Write-Host "📝 Agregando entrada: $ip -> $domain" -ForegroundColor Yellow
        Add-Content -Path $hostsFile -Value "`r`n$ip       $domain" -ErrorAction Stop
        Write-Host "✅ ¡ÉXITO! Dominio agregado correctamente." -ForegroundColor Green
    }
}
catch {
    Write-Host "❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor White
Write-Host "   PRESIONA ENTER PARA SALIR" -ForegroundColor White
Write-Host "==========================================" -ForegroundColor White
Read-Host
