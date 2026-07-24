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
    if ($normalized -match "\\(node_modules|dist|logs|\.test-work|builder-data|__pycache__)\\" -or $normalized -match "\\builder\\\.standalone-template\\") {
        return $false
    }
    if ($normalized.EndsWith("\.env.local", [StringComparison]::OrdinalIgnoreCase)) {
        return $false
    }
    return $normalized -match "\.(ts|tsx|js|mjs|py|css|json|sql|yaml|yml|md|ps1)$"
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

if ($SelfTest) {
    $sourcePath = Join-Path $AppRoot "apps\portal-shell\src\App.tsx"
    $builderSourcePath = Join-Path $AppRoot "builder\oneops_worker.py"
    $builderRuntimePath = Join-Path $AppRoot "builder\.standalone-template\sql\sample.sql"
    $ignoredPath = Join-Path $AppRoot "node_modules\sample\index.js"
    $triggerPath = Join-Path $AppRoot ".continuous-delivery.trigger"
    $relative = Get-RelativeDeliveryPath -Root $AppRoot -Path $sourcePath
    $valid = (Test-RelevantPath -Path $sourcePath) -and
        (Test-RelevantPath -Path $builderSourcePath) -and
        -not (Test-RelevantPath -Path $builderRuntimePath) -and
        -not (Test-RelevantPath -Path $ignoredPath) -and
        (Test-RelevantPath -Path $triggerPath) -and
        $relative -eq "apps\portal-shell\src\App.tsx"
    [pscustomobject]@{
        Valid = $valid
        RelativePath = $relative
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
        if ($event.SourceEventArgs.FullPath) {
            $paths.Add([string]$event.SourceEventArgs.FullPath)
        }
        Remove-Event -EventIdentifier $event.EventIdentifier
        Start-Sleep -Milliseconds $DebounceMilliseconds
        foreach ($queued in @(Get-Event)) {
            if ($queued.SourceIdentifier -in $sourceIds) {
                if ($queued.SourceEventArgs.FullPath) {
                    $paths.Add([string]$queued.SourceEventArgs.FullPath)
                }
                Remove-Event -EventIdentifier $queued.EventIdentifier
            }
        }
        $relevant = @($paths | Where-Object { Test-RelevantPath -Path $_ } | Sort-Object -Unique)
        if ($relevant.Count -eq 0) {
            continue
        }
        $reason = ($relevant | ForEach-Object {
            Get-RelativeDeliveryPath -Root $AppRoot -Path $_
        }) -join ","
        try {
            & $publishScript -AppRoot $AppRoot -Reason $reason
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
