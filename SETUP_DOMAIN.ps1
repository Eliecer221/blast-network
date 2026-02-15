$domain = "blast-network.blast"
$ip = "127.0.0.1"
$hostsFile = "$env:windir\System32\drivers\etc\hosts"

Write-Host "Configuring Windows to recognize $domain..." -ForegroundColor Cyan

try {
    if (-not (Select-String -Path $hostsFile -Pattern $domain)) {
        Add-Content -Path $hostsFile -Value "`n$ip $domain" -ErrorAction Stop
        Write-Host "✅ Success! Added $domain to hosts file." -ForegroundColor Green
    } else {
        Write-Host "ℹ️ $domain is already configured." -ForegroundColor Yellow
    }
    
    Write-Host "`nNow you can open http://$domain:8080 in your browser!" -ForegroundColor White
} catch {
    Write-Host "❌ Error: Please run this script as Administrator." -ForegroundColor Red
}

Start-Sleep -Seconds 5
