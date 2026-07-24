$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$scriptsRoot = $PSScriptRoot
$appRoot = Split-Path -Parent $scriptsRoot
$scriptFiles = @(
    (Join-Path $scriptsRoot "configure-envportal-sso.ps1"),
    (Join-Path $scriptsRoot "publish-portal.ps1"),
    (Join-Path $scriptsRoot "watch-and-publish.ps1"),
    (Join-Path $scriptsRoot "install-continuous-delivery.ps1"),
    (Join-Path $scriptsRoot "migrate-onebuild-data.ps1")
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
    (Join-Path $scriptsRoot "configure-envportal-sso.ps1"),
    (Join-Path $scriptsRoot "publish-portal.ps1")
)
foreach ($restartScriptPath in $restartScripts) {
    $restartScript = Get-Content -Raw -LiteralPath $restartScriptPath
    if (
        $restartScript -notmatch "function Wait-OneOpsGatewayStopped" -or
        $restartScript -notmatch "Get-NetTCPConnection" -or
        $restartScript -notmatch "LocalPort 8092" -or
        $restartScript -notmatch "Wait-OneOpsGatewayStopped\s+Start-ScheduledTask"
    ) {
        throw "Gateway restart must wait until fixed port 8092 is released: $restartScriptPath"
    }
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
    WatcherCompatible = $watcherSelfTest.Valid
    AtomicPublish = $true
    FixedPortRestartBarrier = $true
} | ConvertTo-Json
