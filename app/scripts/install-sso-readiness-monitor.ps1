param(
    [string]$TaskName = "OneOps SSO Readiness Monitor",
    [string]$PackageRoot = "D:\nginx\deploy\oneops-domain-proxy",
    [string]$ProxyUrl = "http://OHR0067:8997"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$identity = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = [Security.Principal.WindowsPrincipal]::new($identity)
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw "Run this installer from an elevated PowerShell window."
}
foreach ($requiredPath in @(
    (Join-Path $PackageRoot "shared-secret.txt"),
    (Join-Path $PSScriptRoot "configure-sso.ps1"),
    (Join-Path $PSScriptRoot "watch-sso-readiness.ps1")
)) {
    if (-not (Test-Path -LiteralPath $requiredPath)) {
        throw "Required SSO readiness file was not found: $requiredPath"
    }
}

Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
$monitorScript = Join-Path $PSScriptRoot "watch-sso-readiness.ps1"
$action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NoProfile -NonInteractive -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$monitorScript`" -PackageRoot `"$PackageRoot`" -ProxyUrl `"$ProxyUrl`"" `
    -WorkingDirectory (Split-Path -Parent $PSScriptRoot)
$trigger = New-ScheduledTaskTrigger -AtStartup
$taskPrincipal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $action `
    -Trigger $trigger `
    -Principal $taskPrincipal `
    -Description "Enables OneOps automatic SSO as soon as the domain proxy is ready" | Out-Null
Start-ScheduledTask -TaskName $TaskName
Start-Sleep -Milliseconds 500
$task = Get-ScheduledTask -TaskName $TaskName
if ($task.State -ne "Running") {
    throw "OneOps SSO readiness monitor did not start."
}

[pscustomobject]@{
    Installed = $true
    TaskName = $TaskName
    State = [string]$task.State
    ProxyUrl = $ProxyUrl
} | ConvertTo-Json
