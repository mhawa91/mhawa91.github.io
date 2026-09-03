# Backs up the personal-website project to a timestamped folder so changes
# made during a Claude Code session can be rolled back easily.
# Runs automatically via the SessionStart hook in .claude/settings.json.

$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$backupRoot  = "D:\AI\personal-website-backups"
$timestamp   = Get-Date -Format "yyyyMMdd_HHmmss"
$dest        = Join-Path $backupRoot $timestamp

New-Item -ItemType Directory -Force -Path $backupRoot | Out-Null

robocopy $projectRoot $dest /E /XD ".git" ".claude" "personal-website-backups" /NFL /NDL /NJH /NJS | Out-Null

# Keep only the most recent 20 backups
$backups = Get-ChildItem $backupRoot -Directory -ErrorAction SilentlyContinue | Sort-Object Name -Descending
if ($backups.Count -gt 20) {
    $backups | Select-Object -Skip 20 | Remove-Item -Recurse -Force
}

Write-Output "Backup created: $dest"
