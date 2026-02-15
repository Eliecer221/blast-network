$hostsPath = "C:\Windows\System32\drivers\etc\hosts"
$domain = "blast-network.blast"
$newEntry = "127.0.0.1       $domain"

# Read content
$content = Get-Content $hostsPath

# Filter out any line that contains the domain (cleaning up malformations)
$newContent = $content | Where-Object { $_ -notmatch [regex]::Escape($domain) }

# Add the clean entry at the end
$newContent += $newEntry

# Join with proper Windows newlines and save
Set-Content -Path $hostsPath -Value ($newContent -join "`r`n") -Encoding ASCII

# Flush DNS
ipconfig /flushdns
