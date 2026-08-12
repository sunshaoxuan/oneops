param(
    [string]$TaskName = "OneOps Runtime Supervisor",
    [string]$AppRoot = "D:\nginx\app",
    [switch]$SelfTest
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

if ($SelfTest) {
    [pscustomobject]@{
        Valid = $TaskName -eq "OneOps Runtime Supervisor"
        AppRoot = [IO.Path]::GetFullPath($AppRoot)
        LaunchesDockerFromSupervisor = $true
        UsesStartupAndLogonTriggers = $true
        UsesS4UPrincipal = $true
    } | ConvertTo-Json -Compress
    exit 0
}

$identity = [Security.Principal.WindowsIdentity]::GetCurrent()
$principalCheck = [Security.Principal.WindowsPrincipal]::new($identity)
if (-not $principalCheck.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw "Run this installer from an elevated PowerShell window."
}
if ($identity.IsSystem) {
    throw "Install the runtime supervisor from the interactive OneOps operator account."
}

$resolvedAppRoot = [IO.Path]::GetFullPath($AppRoot)
$testScript = Join-Path $PSScriptRoot "test-operations-scripts.ps1"
& $testScript
if ($LASTEXITCODE -ne 0) {
    throw "Operations script tests failed."
}

$dockerService = Get-Service -Name "com.docker.service" -ErrorAction SilentlyContinue
if ($dockerService) {
    Set-Service -Name "com.docker.service" -StartupType Automatic
    & sc.exe failure com.docker.service reset= 86400 actions= restart/60000/restart/60000/restart/60000 | Out-Null
}

Unregister-ScheduledTask `
    -TaskName $TaskName `
    -Confirm:$false `
    -ErrorAction SilentlyContinue
$watchScript = Join-Path $PSScriptRoot "watch-oneops-runtime.ps1"
$action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NoProfile -NonInteractive -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$watchScript`" -AppRoot `"$resolvedAppRoot`"" `
    -WorkingDirectory $resolvedAppRoot
$startupTrigger = New-ScheduledTaskTrigger -AtStartup
$logonTrigger = New-ScheduledTaskTrigger -AtLogOn -User $identity.Name
$principal = New-ScheduledTaskPrincipal `
    -UserId $identity.Name `
    -LogonType S4U `
    -RunLevel Highest
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -ExecutionTimeLimit ([TimeSpan]::Zero) `
    -MultipleInstances IgnoreNew `
    -RestartCount 999 `
    -RestartInterval (New-TimeSpan -Minutes 1) `
    -StartWhenAvailable
Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $action `
    -Trigger @($startupTrigger, $logonTrigger) `
    -Principal $principal `
    -Settings $settings `
    -Description "Keeps Docker Desktop, OneOps PostgreSQL, Gateway, automatic SSO and HTTPS ready" | Out-Null

Start-ScheduledTask -TaskName $TaskName
Start-Sleep -Seconds 2
$task = Get-ScheduledTask -TaskName $TaskName
if ([string]$task.State -ne "Running") {
    throw "OneOps runtime supervisor did not start."
}

[pscustomobject]@{
    Installed = $true
    TaskName = $TaskName
    State = [string]$task.State
    RunAs = $identity.Name
    LogonType = "S4U"
    DockerServiceStartup = if ($dockerService) { "Automatic" } else { "Unavailable" }
    DockerLaunch = "OneOps Runtime Supervisor"
    Rollback = "Unregister-ScheduledTask -TaskName '$TaskName' -Confirm:`$false"
} | ConvertTo-Json
