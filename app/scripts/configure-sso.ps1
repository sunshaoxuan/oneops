param(
    [string]$PackageRoot = "D:\nginx\deploy\oneops-domain-proxy",
    [string]$ProxyUrl = "http://OHR0067:8997",
    [string]$PublicBaseUrl = "https://192.168.20.54",
    [switch]$Force
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Set-EnvironmentValue {
    param(
        [string[]]$Lines,
        [string]$Name,
        [string]$Value
    )
    $updated = $false
    $result = foreach ($line in $Lines) {
        if ($line -match "^$([regex]::Escape($Name))=") {
            "$Name=$Value"
            $updated = $true
        }
        else {
            $line
        }
    }
    if (-not $updated) {
        $result += "$Name=$Value"
    }
    return @($result)
}

$secretPath = Join-Path $PackageRoot "shared-secret.txt"
if (-not (Test-Path -LiteralPath $secretPath)) {
    throw "The domain proxy package shared secret was not found."
}
$secret = (Get-Content -Raw -LiteralPath $secretPath).Trim()
if ($secret.Length -lt 32) {
    throw "The domain proxy package shared secret is too short."
}
if (-not $Force) {
    $health = Invoke-RestMethod -Uri "$($ProxyUrl.TrimEnd('/'))/health" -TimeoutSec 5
    if ($health.status -ne "UP" -or -not $health.domainJoined) {
        throw "The domain proxy is not ready on a domain-joined host."
    }
}

$envPath = "D:\nginx\app\.env.local"
$lines = @(Get-Content -LiteralPath $envPath)
$lines = Set-EnvironmentValue -Lines $lines -Name "OPS_SSO_SHARED_SECRET" -Value $secret
$lines = Set-EnvironmentValue -Lines $lines -Name "OPS_WINDOWS_SSO_PROXY_URL" -Value $ProxyUrl.TrimEnd("/")
$lines = Set-EnvironmentValue -Lines $lines -Name "OPS_SSO_ALLOWED_DOMAINS" -Value "onehr.jp"
$lines = Set-EnvironmentValue -Lines $lines -Name "OPS_SSO_AUTO_LOGIN" -Value "true"
$lines = Set-EnvironmentValue -Lines $lines -Name "OPS_PUBLIC_BASE_URL" -Value $PublicBaseUrl.TrimEnd("/")
[IO.File]::WriteAllLines($envPath, $lines, [Text.UTF8Encoding]::new($false))

Stop-ScheduledTask -TaskName "OneHR Operations Compat Gateway"
Start-Sleep -Milliseconds 500
Start-ScheduledTask -TaskName "OneHR Operations Compat Gateway"
$deadline = (Get-Date).AddSeconds(20)
$config = $null
do {
    Start-Sleep -Milliseconds 250
    try {
        $config = Invoke-RestMethod -Uri "http://127.0.0.1:8092/api/work-center/v1/auth/config" -TimeoutSec 2
    }
    catch {
        $config = $null
    }
} while (-not $config -and (Get-Date) -lt $deadline)
if (-not $config -or -not $config.windowsSsoEnabled -or -not $config.windowsSsoAutoLogin) {
    throw "OneOps did not enable Windows SSO after the gateway restart."
}

[pscustomobject]@{
    Enabled = $true
    ProxyUrl = $config.windowsSsoUrl
    AutoLogin = $config.windowsSsoAutoLogin
} | ConvertTo-Json
