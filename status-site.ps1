param(
    [int]$Port = 8000
)

$connection = Test-NetConnection -ComputerName 'localhost' -Port $Port -WarningAction SilentlyContinue

if ($connection.TcpTestSucceeded) {
    Write-Host "Website is running at http://localhost:$Port" -ForegroundColor Green
    Get-CimInstance Win32_Process -Filter "Name = 'python.exe'" |
        Where-Object { $_.CommandLine -match 'http\.server' -and $_.CommandLine -match [regex]::Escape("$Port") } |
        Select-Object ProcessId, Name, CommandLine | Format-Table -AutoSize
} else {
    Write-Host "Website is not running on port $Port." -ForegroundColor Yellow
    exit 1
}
