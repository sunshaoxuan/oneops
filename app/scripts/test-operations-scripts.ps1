$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$scriptsRoot = $PSScriptRoot
$appRoot = Split-Path -Parent $scriptsRoot
$scriptFiles = @(
    (Join-Path $appRoot "domain-proxy\OneOps.DomainProxy.ps1"),
    (Join-Path $scriptsRoot "install-domain-proxy.ps1"),
    (Join-Path $scriptsRoot "new-domain-proxy-package.ps1"),
    (Join-Path $scriptsRoot "configure-sso.ps1"),
    (Join-Path $scriptsRoot "publish-portal.ps1"),
    (Join-Path $scriptsRoot "watch-and-publish.ps1"),
    (Join-Path $scriptsRoot "install-continuous-delivery.ps1"),
    (Join-Path $scriptsRoot "test-domain-proxy-integration.ps1"),
    (Join-Path $scriptsRoot "watch-sso-readiness.ps1"),
    (Join-Path $scriptsRoot "install-sso-readiness-monitor.ps1")
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

$selfTest = & (Join-Path $appRoot "domain-proxy\OneOps.DomainProxy.ps1") -SelfTest |
    ConvertFrom-Json
if (-not $selfTest.Valid) {
    throw "Domain proxy signature compatibility test failed."
}
$watcherSelfTest = & (Join-Path $scriptsRoot "watch-and-publish.ps1") `
    -AppRoot $appRoot `
    -SelfTest |
    ConvertFrom-Json
if (-not $watcherSelfTest.Valid) {
    throw "Continuous delivery watcher compatibility test failed."
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
    SignatureCompatible = $selfTest.Valid
    WatcherCompatible = $watcherSelfTest.Valid
    AtomicPublish = $true
} | ConvertTo-Json
