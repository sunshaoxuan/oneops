param(
    [string]$TaskName = "OneHR Operations Compat Gateway",
    [string]$AppRoot = "D:\nginx\app",
    [switch]$SkipStart
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$task = Get-ScheduledTask -TaskName $TaskName -ErrorAction Stop
if ([string]$task.State -eq "Running") {
    Stop-ScheduledTask -TaskName $TaskName
}

$deadline = (Get-Date).AddSeconds(30)
do {
    $listeners = @(Get-NetTCPConnection -LocalAddress "127.0.0.1" -LocalPort 8092 -State Listen -ErrorAction SilentlyContinue)
    if ([string]$task.State -ne "Running" -and $listeners.Count -eq 0) { break }
    Start-Sleep -Milliseconds 250
    $task = Get-ScheduledTask -TaskName $TaskName -ErrorAction Stop
} while ((Get-Date) -lt $deadline)
if ((Get-Date) -ge $deadline) { throw "8092 の旧 Gateway が停止しません。" }

$script = Join-Path $AppRoot "scripts\start-oneops-backend.ps1"
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$script`"" -WorkingDirectory $AppRoot
Set-ScheduledTask -TaskName $TaskName -Action $action | Out-Null

if (-not $SkipStart) {
    Start-ScheduledTask -TaskName $TaskName
    $deadline = (Get-Date).AddSeconds(45)
    do {
        Start-Sleep -Milliseconds 500
        try {
            $health = Invoke-RestMethod -Uri "http://127.0.0.1:8092/api/work-center/v1/health" -TimeoutSec 2
        }
        catch {
            $health = $null
        }
    } while (-not $health -and (Get-Date) -lt $deadline)
    if (-not $health -or $health.status -ne "UP") { throw "Spring Boot の 8092 Health が確認できません。" }
}
