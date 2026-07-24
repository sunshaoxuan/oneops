param(
    [string]$SsoUrl = "http://OHR0067:8998/oneops_sso.jsp",
    [string]$ProfileUrl = "http://192.168.20.38:8999/auth_windows.jsp",
    [string]$PublicBaseUrl = "https://192.168.20.54",
    [string]$AllowedUpnDomains = "tokyo.scientia.co.jp",
    [string]$AllowedEmailDomains = "onehr.jp",
    [string]$AllowedWindowsDomains = "tokyo",
    [string]$WindowsUpnSuffixes = '{"tokyo":"tokyo.scientia.co.jp"}',
    [string]$AccountLinks = '{"x02851@tokyo.scientia.co.jp":"sun.shaoxuan@onehr.jp"}'
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

function Wait-OneOpsGatewayStopped {
    param([int]$TimeoutSeconds = 20)

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    do {
        $task = Get-ScheduledTask `
            -TaskName "OneHR Operations Compat Gateway" `
            -ErrorAction Stop
        $listeners = @(
            Get-NetTCPConnection `
                -LocalAddress "127.0.0.1" `
                -LocalPort 8092 `
                -State Listen `
                -ErrorAction SilentlyContinue
        )
        if ([string]$task.State -ne "Running" -and $listeners.Count -eq 0) {
            return
        }
        Start-Sleep -Milliseconds 250
    } while ((Get-Date) -lt $deadline)

    throw "OneOps gateway did not stop cleanly or release fixed port 8092."
}

$profileResponse = Invoke-RestMethod -Uri $ProfileUrl -TimeoutSec 5
if ($null -eq $profileResponse.ok) {
    throw "EnvPortal profile endpoint did not return its authentication contract."
}
$profileOrigin = "{0}://{1}" -f ([Uri]$ProfileUrl).Scheme, ([Uri]$ProfileUrl).Authority
$bridgeStatus = 0
try {
    Invoke-WebRequest `
        -Uri "$profileOrigin/oneops_sso.jsp?returnTo=%2F" `
        -UseBasicParsing `
        -MaximumRedirection 0 `
        -TimeoutSec 5 | Out-Null
    $bridgeStatus = 200
}
catch {
    if ($_.Exception.Response) {
        $bridgeStatus = [int]$_.Exception.Response.StatusCode
    }
}
if ($bridgeStatus -ne 403) {
    throw "EnvPortal OneOps bridge is not deployed. Expected anonymous status 403, received $bridgeStatus."
}

$envPath = "D:\nginx\app\.env.local"
$lines = @(Get-Content -LiteralPath $envPath)
$lines = Set-EnvironmentValue -Lines $lines -Name "OPS_ENVPORTAL_SSO_URL" -Value $SsoUrl
$lines = Set-EnvironmentValue -Lines $lines -Name "OPS_ENVPORTAL_PROFILE_URL" -Value $ProfileUrl
$lines = Set-EnvironmentValue -Lines $lines -Name "OPS_SSO_AUTO_LOGIN" -Value "true"
$lines = Set-EnvironmentValue -Lines $lines -Name "OPS_SSO_ALLOWED_DOMAINS" -Value $AllowedUpnDomains
$lines = Set-EnvironmentValue -Lines $lines -Name "OPS_SSO_ALLOWED_EMAIL_DOMAINS" -Value $AllowedEmailDomains
$lines = Set-EnvironmentValue -Lines $lines -Name "OPS_SSO_ALLOWED_WINDOWS_DOMAINS" -Value $AllowedWindowsDomains
$lines = Set-EnvironmentValue -Lines $lines -Name "OPS_SSO_WINDOWS_UPN_SUFFIXES" -Value $WindowsUpnSuffixes
$lines = Set-EnvironmentValue -Lines $lines -Name "OPS_SSO_ACCOUNT_LINKS" -Value $AccountLinks
$lines = Set-EnvironmentValue -Lines $lines -Name "OPS_PUBLIC_BASE_URL" -Value $PublicBaseUrl.TrimEnd("/")
[IO.File]::WriteAllLines($envPath, $lines, [Text.UTF8Encoding]::new($false))

$readinessTask = Get-ScheduledTask `
    -TaskName "OneOps SSO Readiness Monitor" `
    -ErrorAction SilentlyContinue
if ($readinessTask) {
    Unregister-ScheduledTask `
        -TaskName "OneOps SSO Readiness Monitor" `
        -Confirm:$false
}

$gatewayTask = Get-ScheduledTask `
    -TaskName "OneHR Operations Compat Gateway" `
    -ErrorAction Stop
if ([string]$gatewayTask.State -eq "Running") {
    Stop-ScheduledTask -TaskName "OneHR Operations Compat Gateway"
}
Wait-OneOpsGatewayStopped
Start-ScheduledTask -TaskName "OneHR Operations Compat Gateway"
$deadline = (Get-Date).AddSeconds(20)
$config = $null
do {
    Start-Sleep -Milliseconds 250
    try {
        $config = Invoke-RestMethod `
            -Uri "http://127.0.0.1:8092/api/work-center/v1/auth/config" `
            -TimeoutSec 2
    }
    catch {
        $config = $null
    }
} while (-not $config -and (Get-Date) -lt $deadline)
if (
    -not $config -or
    -not $config.windowsSsoEnabled -or
    -not $config.windowsSsoAutoLogin -or
    $config.windowsSsoUrl -ne $SsoUrl
) {
    throw "OneOps did not enable EnvPortal-backed automatic SSO."
}

[pscustomobject]@{
    Enabled = $true
    SsoUrl = $config.windowsSsoUrl
    AutoLogin = $config.windowsSsoAutoLogin
    IdentitySource = "EnvPortal"
} | ConvertTo-Json
