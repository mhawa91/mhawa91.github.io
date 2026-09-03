param(
    [int]$Port = 8000
)

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

$running = Get-CimInstance Win32_Process -Filter "Name = 'python.exe'" |
    Where-Object {
        $_.CommandLine -match 'http\.server' -and
        $_.CommandLine -match [regex]::Escape("$Port") -and
        $_.CommandLine -match [regex]::Escape($root)
    }

if ($running) {
    Write-Host "Website already running at http://localhost:$Port" -ForegroundColor Green
    return
}

Write-Host "Starting website on http://localhost:$Port ..." -ForegroundColor Yellow

$process = Start-Process -FilePath 'python.exe' -ArgumentList @('-m', 'http.server', $Port, '--directory', $root) -PassThru

Start-Sleep -Seconds 1

if (Test-NetConnection -ComputerName 'localhost' -Port $Port -WarningAction SilentlyContinue).TcpTestSucceeded {
    Write-Host "Website is live: http://localhost:$Port" -ForegroundColor Green
    Write-Host "Process ID: $($process.Id)" -ForegroundColor Cyan
} else {
    throw "The website did not start successfully on port $Port."
}
