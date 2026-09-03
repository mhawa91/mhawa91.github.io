param(
    [int]$Port = 8000
)

$ErrorActionPreference = 'Stop'

$matches = Get-CimInstance Win32_Process -Filter "Name = 'python.exe'" |
    Where-Object {
        $_.CommandLine -match 'http\.server' -and
        $_.CommandLine -match [regex]::Escape("$Port")
    }

if (-not $matches) {
    Write-Host "Website is not running on port $Port." -ForegroundColor Yellow
    return
}

foreach ($process in $matches) {
    Stop-Process -Id $process.ProcessId -Force
    Write-Host "Stopped website process $($process.ProcessId) on port $Port." -ForegroundColor Green
}
