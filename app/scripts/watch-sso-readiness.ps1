param(
    [string]$PackageRoot = "D:\nginx\deploy\oneops-domain-proxy",
    [string]$ProxyUrl = "http://OHR0067:8997",
    [int]$PollMilliseconds = 1000
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$appRoot = Split-Path -Parent $PSScriptRoot
$logRoot = Join-Path $appRoot "logs"
$logPath = Join-Path $logRoot "sso-readiness.log"
$configureScript = Join-Path $PSScriptRoot "configure-sso.ps1"
New-Item -ItemType Directory -Force -Path $logRoot | Out-Null

function Write-ReadinessLog {
    param([string]$Message)
    Add-Content -LiteralPath $logPath -Value "$(Get-Date -Format o) $Message" -Encoding UTF8
}

$currentConfig = Invoke-RestMethod `
    -Uri "http://127.0.0.1:8092/api/work-center/v1/auth/config" `
    -TimeoutSec 5
if ($currentConfig.windowsSsoEnabled -and $currentConfig.windowsSsoAutoLogin) {
    Write-ReadinessLog "sso_already_enabled"
    exit 0
}

Write-ReadinessLog "readiness_monitor_started proxy=$ProxyUrl"
$attempt = 0
while ($true) {
    $attempt++
    try {
        $health = Invoke-RestMethod `
            -Uri "$($ProxyUrl.TrimEnd('/'))/health" `
            -TimeoutSec 2
        if ($health.status -eq "UP" -and $health.domainJoined) {
            & $configureScript -PackageRoot $PackageRoot -ProxyUrl $ProxyUrl
            Write-ReadinessLog "sso_enabled proxy=$ProxyUrl domain=$($health.domain)"
            exit 0
        }
    }
    catch {
        if (($attempt % 30) -eq 1) {
            Write-ReadinessLog "proxy_pending proxy=$ProxyUrl"
        }
    }
    Start-Sleep -Milliseconds $PollMilliseconds
}
