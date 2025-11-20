<#
Simple helper to start the GeniDoc server and handle port conflicts on Windows PowerShell.
Usage:
  From repo root:
    .\tools\start_server.ps1 -Port 3000 -ServerFile "serveurs/server.js"
#>
param(
  [int]$Port = 3000,
  [string]$ServerFile = "serveurs/server.js"
)

function Get-ProcessUsingPort($port) {
  try {
    $conn = Get-NetTCPConnection -LocalPort $port -ErrorAction Stop | Select-Object -First 1
    if ($conn) { return Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue }
    return $null
  } catch {
    return $null
  }
}

$proc = Get-ProcessUsingPort -port $Port
if ($proc) {
  Write-Host "Port $Port is in use by PID $($proc.Id) ($($proc.ProcessName))." -ForegroundColor Yellow
  $choice = Read-Host "Kill that process? (y/N) or press ENTER to start server on next free port"
  if ($choice -match '^[yY]') {
    try {
      Stop-Process -Id $proc.Id -Force -ErrorAction Stop
      Write-Host "Process $($proc.Id) killed. Starting server on port $Port..." -ForegroundColor Green
      $env:PORT = $Port
      node $ServerFile
      exit
    } catch {
      Write-Host "Failed to kill process: $_" -ForegroundColor Red
      exit 1
    }
  } else {
    # find a free port between Port+1..Port+50
    $free = $null
    for ($p = $Port + 1; $p -le $Port + 50; $p++) {
      if (-not (Get-ProcessUsingPort -port $p)) { $free = $p; break }
    }
    if ($free) {
      Write-Host "Starting server on free port $free" -ForegroundColor Green
      $env:PORT = $free
      node $ServerFile
      exit
    } else {
      Write-Host "No free port found in range. Please free port $Port manually." -ForegroundColor Red
      exit 1
    }
  }
} else {
  Write-Host "Port $Port appears free. Starting server..." -ForegroundColor Green
  $env:PORT = $Port
  node $ServerFile
}
