param(
    [string]$PackageRoot = $PSScriptRoot,
    [string]$InstallRoot = "C:\OneOpsDomainProxy",
    [string]$TaskName = "OneOps Domain Proxy"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$identity = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = [Security.Principal.WindowsPrincipal]::new($identity)
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw "Run this installer from an elevated PowerShell window."
}
$machine = Get-CimInstance Win32_ComputerSystem
if (-not $machine.PartOfDomain) {
    throw "The OneOps domain proxy must be installed on a domain-joined Windows host."
}

$proxySource = Join-Path $PackageRoot "OneOps.DomainProxy.ps1"
$configSource = Join-Path $PackageRoot "domain-proxy.json"
$secretSource = Join-Path $PackageRoot "shared-secret.txt"
foreach ($path in $proxySource, $configSource, $secretSource) {
    if (-not (Test-Path -LiteralPath $path)) {
        throw "Required package file is missing: $path"
    }
}

New-Item -ItemType Directory -Force -Path $InstallRoot | Out-Null
Copy-Item -LiteralPath $proxySource -Destination (Join-Path $InstallRoot "OneOps.DomainProxy.ps1") -Force
Copy-Item -LiteralPath $configSource -Destination (Join-Path $InstallRoot "domain-proxy.json") -Force
Copy-Item -LiteralPath $secretSource -Destination (Join-Path $InstallRoot "shared-secret.txt") -Force

$secretPath = Join-Path $InstallRoot "shared-secret.txt"
& icacls.exe $secretPath /inheritance:r | Out-Null
& icacls.exe $secretPath /grant:r "*S-1-5-18:(F)" "*S-1-5-32-544:(F)" | Out-Null

$config = Get-Content -Raw -LiteralPath (Join-Path $InstallRoot "domain-proxy.json") | ConvertFrom-Json
$listenPrefix = [string]$config.ListenPrefix
$port = ([Uri]($listenPrefix.Replace("+", "localhost"))).Port
& netsh.exe http delete urlacl "url=$listenPrefix" 2>$null | Out-Null
& netsh.exe http add urlacl "url=$listenPrefix" "user=NT AUTHORITY\SYSTEM" | Out-Null

$firewallName = "OneOps Domain Proxy $port"
Get-NetFirewallRule -DisplayName $firewallName -ErrorAction SilentlyContinue |
    Remove-NetFirewallRule -ErrorAction SilentlyContinue
New-NetFirewallRule `
    -DisplayName $firewallName `
    -Direction Inbound `
    -Action Allow `
    -Protocol TCP `
    -LocalPort $port `
    -Profile Domain `
    -RemoteAddress LocalSubnet | Out-Null

Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
$action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NoProfile -NonInteractive -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$InstallRoot\OneOps.DomainProxy.ps1`" -ConfigPath `"$InstallRoot\domain-proxy.json`"" `
    -WorkingDirectory $InstallRoot
$trigger = New-ScheduledTaskTrigger -AtStartup
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $action `
    -Trigger $trigger `
    -Principal $principal `
    -Description "Windows Integrated Authentication proxy for OneOps" | Out-Null
Start-ScheduledTask -TaskName $TaskName

$deadline = (Get-Date).AddSeconds(15)
$health = $null
do {
    Start-Sleep -Milliseconds 250
    try {
        $health = Invoke-RestMethod -Uri "http://127.0.0.1:$port/health" -TimeoutSec 2
    }
    catch {
        $health = $null
    }
} while (-not $health -and (Get-Date) -lt $deadline)
if (-not $health -or $health.status -ne "UP" -or -not $health.domainJoined) {
    throw "The OneOps domain proxy did not become ready."
}

[pscustomobject]@{
    Installed = $true
    TaskName = $TaskName
    ListenPrefix = $listenPrefix
    Domain = $health.domain
    Target = $health.target
} | ConvertTo-Json
