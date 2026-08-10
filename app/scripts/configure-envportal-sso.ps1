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
    param(
        [int]$TimeoutSeconds = 20,
        [int]$QuietPeriodMilliseconds = 5000
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    $quietSince = $null
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
            if ($null -eq $quietSince) {
                $quietSince = Get-Date
            }
            elseif (
                ((Get-Date) - $quietSince).TotalMilliseconds -ge
                $QuietPeriodMilliseconds
            ) {
                return
            }
        }
        else {
            $quietSince = $null
        }
        Start-Sleep -Milliseconds 250
    } while ((Get-Date) -lt $deadline)

    throw "OneOps gateway did not reach a stable stopped state on fixed port 8092."
}

function Get-OneOpsHealth {
    try {
        return Invoke-RestMethod `
            -Uri "http://127.0.0.1:8092/api/work-center/v1/health" `
            -TimeoutSec 2
    }
    catch {
        return $null
    }
}

function Test-OneOpsHealth {
    param($Health)

    if ($null -eq $Health) {
        return $false
    }
    $statusProperty = $Health.PSObject.Properties["status"]
    $upstreamProperty = $Health.PSObject.Properties["upstream"]
    if (
        $null -eq $statusProperty -or
        $null -eq $upstreamProperty -or
        $null -eq $upstreamProperty.Value
    ) {
        return $false
    }
    $onlineProperty = $upstreamProperty.Value.PSObject.Properties["online"]
    return (
        $Health.status -eq "UP" -and
        $null -ne $onlineProperty -and
        $upstreamProperty.Value.online -eq $true
    )
}

function Get-OneOpsAuthConfig {
    try {
        return Invoke-RestMethod `
            -Uri "http://127.0.0.1:8092/api/work-center/v1/auth/config" `
            -TimeoutSec 2
    }
    catch {
        return $null
    }
}

function Test-OneOpsAuthConfig {
    param($Config)

    if ($null -eq $Config) {
        return $false
    }
    foreach ($propertyName in @(
        "windowsSsoEnabled",
        "windowsSsoAutoLogin",
        "windowsSsoUrl"
    )) {
        if ($null -eq $Config.PSObject.Properties[$propertyName]) {
            return $false
        }
    }
    return (
        $Config.windowsSsoEnabled -eq $true -and
        $Config.windowsSsoAutoLogin -eq $true -and
        $Config.windowsSsoUrl -eq $SsoUrl
    )
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
$deadline = (Get-Date).AddSeconds(60)
$health = $null
$config = $null
$compositeReady = $false
$stableSince = $null
do {
    Start-Sleep -Milliseconds 250
    $health = Get-OneOpsHealth
    $config = Get-OneOpsAuthConfig
    $compositeReady = (
        (Test-OneOpsHealth -Health $health) -and
        (Test-OneOpsAuthConfig -Config $config)
    )
    if ($compositeReady) {
        if ($null -eq $stableSince) {
            $stableSince = Get-Date
        }
        elseif (((Get-Date) - $stableSince).TotalSeconds -ge 5) {
            break
        }
    }
    else {
        $stableSince = $null
    }
} while ((Get-Date) -lt $deadline)
if ($null -eq $stableSince -or ((Get-Date) - $stableSince).TotalSeconds -lt 5) {
    throw "OneOps のヘルス状態と EnvPortal 自動 SSO 設定が制限時間内に同時に準備完了になりませんでした。"
}

[pscustomobject]@{
    Enabled = $true
    Health = $health.status
    UpstreamOnline = [bool]$health.upstream.online
    SsoUrl = $config.windowsSsoUrl
    AutoLogin = $config.windowsSsoAutoLogin
    IdentitySource = "EnvPortal"
} | ConvertTo-Json
