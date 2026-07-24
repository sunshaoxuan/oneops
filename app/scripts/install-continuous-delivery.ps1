param(
    [string]$TaskName = "OneOps Continuous Delivery"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$identity = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = [Security.Principal.WindowsPrincipal]::new($identity)
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw "Run this installer from an elevated PowerShell window."
}

$appRoot = Split-Path -Parent $PSScriptRoot
$nginxRoot = Split-Path -Parent $appRoot
$testScript = Join-Path $PSScriptRoot "test-operations-scripts.ps1"
& $testScript
if ($LASTEXITCODE -ne 0) {
    throw "Operations script tests failed."
}

& icacls.exe $appRoot /inheritance:d | Out-Null
& icacls.exe $appRoot /remove:g "*S-1-5-11" | Out-Null
& icacls.exe $appRoot /grant:r `
    "*S-1-5-18:(OI)(CI)(F)" `
    "*S-1-5-32-544:(OI)(CI)(F)" `
    "*S-1-5-32-545:(OI)(CI)(RX)" | Out-Null

Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
$watchScript = Join-Path $PSScriptRoot "watch-and-publish.ps1"
$action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NoProfile -NonInteractive -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$watchScript`" -AppRoot `"$appRoot`"" `
    -WorkingDirectory $appRoot
$trigger = New-ScheduledTaskTrigger -AtStartup
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $action `
    -Trigger $trigger `
    -Principal $principal `
    -Description "Tests, builds and publishes OneOps immediately after source changes" | Out-Null
Start-ScheduledTask -TaskName $TaskName
Start-Sleep -Milliseconds 500
$task = Get-ScheduledTask -TaskName $TaskName
if ($task.State -ne "Running") {
    throw "OneOps continuous delivery watcher did not start."
}

[pscustomobject]@{
    Installed = $true
    TaskName = $TaskName
    State = [string]$task.State
    AppRoot = $appRoot
    Rollback = "Unregister-ScheduledTask -TaskName '$TaskName' -Confirm:`$false; icacls.exe '$appRoot' /inheritance:e"
} | ConvertTo-Json
