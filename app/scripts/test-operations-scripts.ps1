$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$scriptsRoot = $PSScriptRoot
$appRoot = Split-Path -Parent $scriptsRoot
$scriptFiles = @(
    (Join-Path $scriptsRoot "configure-envportal-sso.ps1"),
    (Join-Path $scriptsRoot "publish-portal.ps1"),
    (Join-Path $scriptsRoot "watch-and-publish.ps1"),
    (Join-Path $scriptsRoot "install-continuous-delivery.ps1"),
    (Join-Path $scriptsRoot "migrate-onebuild-data.ps1"),
    (Join-Path $scriptsRoot "ensure-oneops-runtime.ps1"),
    (Join-Path $scriptsRoot "watch-oneops-runtime.ps1"),
    (Join-Path $scriptsRoot "install-runtime-supervisor.ps1"),
    (Join-Path $scriptsRoot "start-oneops-backend.ps1")
)
foreach ($script in $scriptFiles) {
    $tokens = $null
    $errors = $null
    [void][Management.Automation.Language.Parser]::ParseFile(
        $script,
        [ref]$tokens,
        [ref]$errors
    )
    if ($errors.Count -gt 0) {
        throw "PowerShell syntax validation failed for $script`: $($errors[0].Message)"
    }
}

$watcherSelfTest = & (Join-Path $scriptsRoot "watch-and-publish.ps1") `
    -AppRoot $appRoot `
    -SelfTest |
    ConvertFrom-Json
if (-not $watcherSelfTest.Valid) {
    throw "Continuous delivery watcher compatibility test failed."
}
if (
    $watcherSelfTest.FrontendRequiresGatewayRestart -or
    -not $watcherSelfTest.GatewayRequiresGatewayRestart -or
    -not $watcherSelfTest.MixedRequiresGatewayRestart
) {
    throw "Continuous delivery gateway restart classification failed."
}
$migrationScript = Get-Content -Raw -LiteralPath (
    Join-Path $scriptsRoot "migrate-onebuild-data.ps1"
)
if (
    $migrationScript -notmatch "\[IO\.File\]::ReadAllText" -or
    $migrationScript -notmatch "\[Text\.UTF8Encoding\]::new\(\`$false, \`$true\)"
) {
    throw "OneBuild migration must preserve strict UTF-8 metadata."
}
$restartScripts = @(
    (Join-Path $scriptsRoot "configure-envportal-sso.ps1")
)
foreach ($restartScriptPath in $restartScripts) {
    $restartScript = Get-Content -Raw -LiteralPath $restartScriptPath
    if (
        $restartScript -notmatch "function Wait-OneOpsGatewayStopped" -or
        $restartScript -notmatch "Get-NetTCPConnection" -or
        $restartScript -notmatch "LocalPort 8092" -or
        $restartScript -notmatch "QuietPeriodMilliseconds = 5000" -or
        $restartScript -notmatch "TotalMilliseconds" -or
        $restartScript -notmatch "Wait-OneOpsGatewayStopped\s+Start-ScheduledTask"
    ) {
        throw "Gateway restart must wait until fixed port 8092 is released: $restartScriptPath"
    }
}
$publishScript = Get-Content -Raw -LiteralPath (
    Join-Path $scriptsRoot "publish-portal.ps1"
)
$watchScript = Get-Content -Raw -LiteralPath (
    Join-Path $scriptsRoot "watch-and-publish.ps1"
)
$startBackendScript = Get-Content -Raw -LiteralPath (
    Join-Path $scriptsRoot "start-oneops-backend.ps1"
)
$nginxRoot = Split-Path -Parent $appRoot
$nginxConfig = Get-Content -Raw -LiteralPath (Join-Path $nginxRoot "conf\nginx.conf")
$upstreamConfig = Get-Content -Raw -LiteralPath (
    Join-Path $nginxRoot "conf\oneops-backend-upstream.conf"
)
if (
    $publishScript -notmatch "\[switch\]\`$SkipGatewayRestart" -or
    $publishScript -notmatch "gateway_restart_skipped" -or
    $publishScript -notmatch 'Global\\OneOpsContinuousDelivery' -or
    $publishScript -notmatch '\[ref\]\$createdNew' -or
    $publishScript -notmatch 'WaitOne\(\[TimeSpan\]::FromMinutes\(5\)\)' -or
    $watchScript -notmatch "Test-RequiresGatewayRestart" -or
    $watchScript -notmatch "SkipGatewayRestart" -or
    $watchScript -notmatch "packages\\\\api-client\|docs"
) {
    throw "Frontend-only delivery must preserve the running fixed-port gateway."
}
if (
    $publishScript -notmatch "CandidateGatewayPort = 8094" -or
    $publishScript -notmatch "CandidateLegacyGatewayPort = 8095" -or
    $publishScript -notmatch "function Start-OneOpsCandidate" -or
    $publishScript -notmatch 'Set-OneOpsBackendUpstream -Port \$CandidateGatewayPort' -or
    $publishScript -notmatch "Wait-OneOpsHealth -Port 8092" -or
    $publishScript -notmatch "delivery_degraded_candidate_kept" -or
    $publishScript -notmatch "oneops-backend-rolling.jar" -or
    $publishScript -notmatch '\-Prolling' -or
    $publishScript -notmatch "primaryJarPath.next" -or
    $startBackendScript -notmatch "JarPath" -or
    $startBackendScript -notmatch "GatewayPort = 8092" -or
    $startBackendScript -notmatch "LegacyGatewayPort = 8093" -or
    $nginxConfig -notmatch "include oneops-backend-upstream.conf" -or
    $upstreamConfig -notmatch "127.0.0.1:8092"
) {
    throw "Backend delivery must use the tested candidate and an Nginx rolling switch."
}
if (
    $publishScript -notmatch 'Join-Path \$nginxRoot "VERSION"' -or
    $publishScript -notmatch 'stableWindowSeconds = 5' -or
    $publishScript -notmatch '\$health\.status -eq "UP"' -or
    $publishScript -notmatch '\$upstream\.online -eq \$true' -or
    $publishScript -notmatch '\[string\]\$upstream\.version -eq \$requiredVersion' -or
    $publishScript -notmatch 'TimeoutSeconds 8 -AllowAnyVersion'
) {
    throw "公開処理はルート VERSION と一致する上流の正常状態を 5 秒間連続確認する必要があります。"
}
$configureSsoScript = Get-Content -Raw -LiteralPath (
    Join-Path $scriptsRoot "configure-envportal-sso.ps1"
)
if (
    $configureSsoScript -notmatch "function Get-OneOpsHealth" -or
    $configureSsoScript -notmatch "function Test-OneOpsHealth" -or
    $configureSsoScript -notmatch '\$Health\.status -eq "UP"' -or
    $configureSsoScript -notmatch '\$upstreamProperty\.Value\.online -eq \$true' -or
    $configureSsoScript -notmatch "function Get-OneOpsAuthConfig" -or
    $configureSsoScript -notmatch "Test-OneOpsHealth -Health \`$health" -or
    $configureSsoScript -notmatch "Test-OneOpsAuthConfig -Config \`$config" -or
    $configureSsoScript -notmatch 'TotalSeconds -ge 5'
) {
    throw "EnvPortal SSO 設定後の再起動ではヘルス状態と SSO 設定を同時に確認する必要があります。"
}

$runtimeSelfTest = & (Join-Path $scriptsRoot "ensure-oneops-runtime.ps1") `
    -AppRoot $appRoot `
    -SelfTest |
    ConvertFrom-Json
if (
    -not $runtimeSelfTest.Valid -or
    -not $runtimeSelfTest.AutomaticSsoRestored -or
    -not $runtimeSelfTest.EnvPortalSsoUrlRestored -or
    -not $runtimeSelfTest.EnvPortalProfileUrlRestored -or
    -not $runtimeSelfTest.SecretPreserved -or
    -not $runtimeSelfTest.CompositeReadiness -or
    $runtimeSelfTest.ProtectedVolumeName -ne "onehr-operations-postgres-data"
) {
    throw "OneOps runtime recovery self-test failed."
}
$runtimeWatcherSelfTest = & (Join-Path $scriptsRoot "watch-oneops-runtime.ps1") `
    -AppRoot $appRoot `
    -SelfTest |
    ConvertFrom-Json
if (
    -not $runtimeWatcherSelfTest.Valid -or
    -not $runtimeWatcherSelfTest.UsesOneShotRecovery
) {
    throw "OneOps runtime supervisor self-test failed."
}
$runtimeInstallerSelfTest = & (Join-Path $scriptsRoot "install-runtime-supervisor.ps1") `
    -AppRoot $appRoot `
    -SelfTest |
    ConvertFrom-Json
if (
    -not $runtimeInstallerSelfTest.Valid -or
    -not $runtimeInstallerSelfTest.LaunchesDockerFromSupervisor -or
    -not $runtimeInstallerSelfTest.UsesStartupAndLogonTriggers
) {
    throw "OneOps runtime supervisor installer self-test failed."
}
$runtimeScript = Get-Content -Raw -LiteralPath (
    Join-Path $scriptsRoot "ensure-oneops-runtime.ps1"
)
if (
    $runtimeScript -match "volume create" -or
    $runtimeScript -notmatch "Protected OneOps database volume is missing" -or
    $runtimeScript -notmatch "OPS_SSO_AUTO_LOGIN" -or
    $runtimeScript -notmatch "OPS_ENVPORTAL_SSO_URL" -or
    $runtimeScript -notmatch "OPS_ENVPORTAL_PROFILE_URL" -or
    $runtimeScript -notmatch "OPS_WINDOWS_SSO_PROXY_URL" -or
    $runtimeScript -notmatch "windowsSsoAutoLogin" -or
    $runtimeScript -notmatch "function Get-GatewayHealth" -or
    $runtimeScript -notmatch "function Test-GatewayHealth" -or
    $runtimeScript -notmatch '\$Health\.status -eq "UP"' -or
    $runtimeScript -notmatch '\$upstreamProperty\.Value\.online -eq \$true' -or
    $runtimeScript -notmatch "Test-GatewayHealth -Health \`$health" -or
    $runtimeScript -notmatch "Test-AuthConfig -Config \`$config" -or
    $runtimeScript -notmatch 'TotalSeconds -ge 5' -or
    $runtimeScript -notmatch "Enable-AutomaticSso" -or
    $runtimeScript -notmatch "Test-SsoProxy" -or
    $runtimeScript -notmatch "automatic_sso_configuration_restored" -or
    $runtimeScript -notmatch 'Global\\OneOpsContinuousDelivery' -or
    $runtimeScript -notmatch "Continuous delivery is active" -or
    $runtimeScript -notmatch "desktop start" -or
    $runtimeScript -notmatch '\$ErrorActionPreference = "SilentlyContinue"'
) {
    throw "Runtime recovery must protect data, automatic SSO and Docker recovery."
}

$testRootBase = Join-Path $appRoot ".test-work"
$testRoot = Join-Path $testRootBase ("continuous-delivery-" + [Guid]::NewGuid().ToString("N"))
$resolvedTestRoot = [IO.Path]::GetFullPath($testRoot)
$resolvedBase = [IO.Path]::GetFullPath($testRootBase)
if (-not $resolvedTestRoot.StartsWith($resolvedBase, [StringComparison]::OrdinalIgnoreCase)) {
    throw "Invalid test workspace."
}
try {
    $dist = Join-Path $testRoot "dist"
    $assets = Join-Path $dist "assets"
    $web = Join-Path $testRoot "web"
    New-Item -ItemType Directory -Force -Path $assets, $web | Out-Null
    [IO.File]::WriteAllText(
        (Join-Path $dist "index.html"),
        '<script type="module" src="/assets/index-test.js"></script><link rel="stylesheet" href="/assets/index-test.css">',
        [Text.UTF8Encoding]::new($false)
    )
    [IO.File]::WriteAllText((Join-Path $assets "index-test.js"), "console.log('ok')", [Text.UTF8Encoding]::new($false))
    [IO.File]::WriteAllText((Join-Path $assets "index-test.css"), "body{color:#333}", [Text.UTF8Encoding]::new($false))
    & (Join-Path $scriptsRoot "publish-portal.ps1") `
        -AppRoot $appRoot `
        -DistRoot $dist `
        -WebRoot $web `
        -SkipChecks `
        -SkipRuntimeValidation `
        -SkipDeliveryLock `
        -Reason "unit-test"
    foreach ($path in "index.html", "assets\index-test.js", "assets\index-test.css") {
        if (-not (Test-Path -LiteralPath (Join-Path $web $path))) {
            throw "Atomic portal publication test failed for $path."
        }
    }
}
finally {
    if (Test-Path -LiteralPath $resolvedTestRoot) {
        Remove-Item -LiteralPath $resolvedTestRoot -Recurse -Force
    }
}

[pscustomobject]@{
    Passed = $true
    ParsedScripts = $scriptFiles.Count
    WatcherCompatible = $watcherSelfTest.Valid
    AtomicPublish = $true
    FixedPortRestartBarrier = $true
    GatewayRollingSwitch = $true
    FrontendPreservesGateway = $true
    RuntimeRecovery = $runtimeSelfTest.Valid
    CompositeReadiness = $runtimeSelfTest.CompositeReadiness
    RuntimeSupervisor = $runtimeWatcherSelfTest.Valid
    RuntimeSupervisorInstaller = $runtimeInstallerSelfTest.Valid
} | ConvertTo-Json
