param(
    [string]$AppRoot = "D:\nginx\app",
    [int]$DebounceMilliseconds = 300,
    [switch]$SelfTest
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Test-RelevantPath {
    param([string]$Path)
    $normalized = $Path.Replace("/", "\")
    if ($normalized.EndsWith("\.continuous-delivery.trigger", [StringComparison]::OrdinalIgnoreCase)) {
        return $true
    }
    $ignoredWorktreeRoot = [IO.Path]::GetFullPath(
        (Join-Path $AppRoot ".codex-work")
    ).TrimEnd("\") + "\"
    if ($normalized.StartsWith($ignoredWorktreeRoot, [StringComparison]::OrdinalIgnoreCase)) {
        return $false
    }
    if ($normalized -match "\\(node_modules|dist|logs|target|target-rolling|\.test-work|builder-data|__pycache__)\\" -or $normalized -match "\\builder\\\.standalone-template\\") {
        return $false
    }
    if ($normalized.EndsWith("\.env.local", [StringComparison]::OrdinalIgnoreCase)) {
        return $false
    }
    return $normalized -match "\.(ts|tsx|js|mjs|java|xml|py|css|json|sql|yaml|yml|md|ps1)$"
}

function Get-RelativeDeliveryPath {
    param(
        [string]$Root,
        [string]$Path
    )
    $normalizedRoot = [IO.Path]::GetFullPath($Root).TrimEnd("\")
    $normalizedPath = [IO.Path]::GetFullPath($Path)
    if (-not $normalizedPath.StartsWith(
        $normalizedRoot + "\",
        [StringComparison]::OrdinalIgnoreCase
    )) {
        throw "Changed path is outside the OneOps app root."
    }
    return $normalizedPath.Substring($normalizedRoot.Length + 1)
}

function Test-RequiresGatewayRestart {
    param([string[]]$RelativePaths)

    foreach ($path in $RelativePaths) {
        $normalized = $path.Replace("/", "\")
        if (
            $normalized -notmatch
            "^(apps\\portal-shell|packages\\api-client|docs)\\"
        ) {
            return $true
        }
    }
    return $false
}

if ($SelfTest) {
    $sourcePath = Join-Path $AppRoot "apps\portal-shell\src\App.tsx"
    $builderSourcePath = Join-Path $AppRoot "builder\oneops_worker.py"
    $builderRuntimePath = Join-Path $AppRoot "builder\.standalone-template\sql\sample.sql"
    $ignoredPath = Join-Path $AppRoot "node_modules\sample\index.js"
    $ignoredWorktreePath = Join-Path $AppRoot ".codex-work\sample\app\apps\portal-shell\src\App.tsx"
    $backendTargetPath = Join-Path $AppRoot "backend\target\generated-spring-modulith\javadoc.json"
    $backendSourcePath = Join-Path $AppRoot "backend\src\main\java\jp\onehr\oneops\masterdata\application\MasterDataService.java"
    $triggerPath = Join-Path $AppRoot ".continuous-delivery.trigger"
    $relative = Get-RelativeDeliveryPath -Root $AppRoot -Path $sourcePath
    $frontendRequiresGatewayRestart = Test-RequiresGatewayRestart -RelativePaths @(
        "apps\portal-shell\src\App.tsx",
        "apps\portal-shell\src\styles.css",
        "docs\BASIC_MASTER_MANAGEMENT_REQUIREMENTS.md"
    )
    $gatewayRequiresGatewayRestart = Test-RequiresGatewayRestart -RelativePaths @(
        "gateway\server.mjs"
    )
    $mixedRequiresGatewayRestart = Test-RequiresGatewayRestart -RelativePaths @(
        "apps\portal-shell\src\App.tsx",
        "gateway\server.mjs"
    )
    $valid = (Test-RelevantPath -Path $sourcePath) -and
        (Test-RelevantPath -Path $builderSourcePath) -and
        -not (Test-RelevantPath -Path $builderRuntimePath) -and
        -not (Test-RelevantPath -Path $ignoredPath) -and
        -not (Test-RelevantPath -Path $ignoredWorktreePath) -and
        -not (Test-RelevantPath -Path $backendTargetPath) -and
        (Test-RelevantPath -Path $backendSourcePath) -and
        (Test-RelevantPath -Path $triggerPath) -and
        $relative -eq "apps\portal-shell\src\App.tsx" -and
        -not $frontendRequiresGatewayRestart -and
        $gatewayRequiresGatewayRestart -and
        $mixedRequiresGatewayRestart
    [pscustomobject]@{
        Valid = $valid
        RelativePath = $relative
        FrontendRequiresGatewayRestart = $frontendRequiresGatewayRestart
        GatewayRequiresGatewayRestart = $gatewayRequiresGatewayRestart
        MixedRequiresGatewayRestart = $mixedRequiresGatewayRestart
    } | ConvertTo-Json -Compress
    exit 0
}

$publishScript = Join-Path $AppRoot "scripts\publish-portal.ps1"
$logPath = Join-Path $AppRoot "logs\continuous-delivery.log"
$watcher = [IO.FileSystemWatcher]::new($AppRoot)
$watcher.IncludeSubdirectories = $true
$watcher.NotifyFilter = [IO.NotifyFilters]::FileName -bor
    [IO.NotifyFilters]::DirectoryName -bor
    [IO.NotifyFilters]::LastWrite
$watcher.EnableRaisingEvents = $true
$sourceIds = @(
    "OneOps.CD.Changed",
    "OneOps.CD.Created",
    "OneOps.CD.Deleted",
    "OneOps.CD.Renamed"
)
Register-ObjectEvent -InputObject $watcher -EventName Changed -SourceIdentifier $sourceIds[0] | Out-Null
Register-ObjectEvent -InputObject $watcher -EventName Created -SourceIdentifier $sourceIds[1] | Out-Null
Register-ObjectEvent -InputObject $watcher -EventName Deleted -SourceIdentifier $sourceIds[2] | Out-Null
Register-ObjectEvent -InputObject $watcher -EventName Renamed -SourceIdentifier $sourceIds[3] | Out-Null

try {
    Add-Content -LiteralPath $logPath -Value "$(Get-Date -Format o) watcher_started" -Encoding UTF8
    while ($true) {
        $event = Wait-Event -Timeout 1
        if (-not $event) {
            continue
        }
        $paths = [Collections.Generic.List[string]]::new()
        $eventIsTriggerDeletion =
            $event.SourceEventArgs.ChangeType -eq [IO.WatcherChangeTypes]::Deleted -and
            [string]$event.SourceEventArgs.FullPath -and
            [string]$event.SourceEventArgs.FullPath.EndsWith(
                "\.continuous-delivery.trigger",
                [StringComparison]::OrdinalIgnoreCase
            )
        if ($event.SourceEventArgs.FullPath -and -not $eventIsTriggerDeletion) {
            $paths.Add([string]$event.SourceEventArgs.FullPath)
        }
        Remove-Event -EventIdentifier $event.EventIdentifier
        Start-Sleep -Milliseconds $DebounceMilliseconds
        foreach ($queued in @(Get-Event)) {
            if ($queued.SourceIdentifier -in $sourceIds) {
                $queuedIsTriggerDeletion =
                    $queued.SourceEventArgs.ChangeType -eq [IO.WatcherChangeTypes]::Deleted -and
                    [string]$queued.SourceEventArgs.FullPath -and
                    [string]$queued.SourceEventArgs.FullPath.EndsWith(
                        "\.continuous-delivery.trigger",
                        [StringComparison]::OrdinalIgnoreCase
                    )
                if ($queued.SourceEventArgs.FullPath -and -not $queuedIsTriggerDeletion) {
                    $paths.Add([string]$queued.SourceEventArgs.FullPath)
                }
                Remove-Event -EventIdentifier $queued.EventIdentifier
            }
        }
        $relevant = @($paths | Where-Object { Test-RelevantPath -Path $_ } | Sort-Object -Unique)
        if ($relevant.Count -eq 0) {
            continue
        }
        $relativePaths = @($relevant | ForEach-Object {
            Get-RelativeDeliveryPath -Root $AppRoot -Path $_
        })
        $reason = $relativePaths -join ","
        $requiresGatewayRestart = Test-RequiresGatewayRestart `
            -RelativePaths $relativePaths
        try {
            $publishArguments = @{
                AppRoot = $AppRoot
                Reason = $reason
            }
            if (-not $requiresGatewayRestart) {
                $publishArguments.SkipGatewayRestart = $true
            }
            & $publishScript @publishArguments
        }
        catch {
            Add-Content -LiteralPath $logPath -Value "$(Get-Date -Format o) watcher_delivery_failed error=$($_.Exception.Message)" -Encoding UTF8
        }
    }
}
finally {
    foreach ($sourceId in $sourceIds) {
        Unregister-Event -SourceIdentifier $sourceId -ErrorAction SilentlyContinue
    }
    $watcher.Dispose()
}
