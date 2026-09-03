param(
    [int]$Port = 8000
)

$siteUrl = "http://localhost:$Port"
Start-Process $siteUrl
Write-Host "Opened $siteUrl in your default browser." -ForegroundColor Green
