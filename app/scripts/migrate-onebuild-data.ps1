param(
    [string]$SourceRoot = "D:\workspace\droneci\dist",
    [string]$TargetRoot = "D:\nginx\app\builder-data"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$sourceBuilds = [IO.Path]::GetFullPath((Join-Path $SourceRoot "standalone-builds"))
$sourceDeliveries = [IO.Path]::GetFullPath((Join-Path $SourceRoot "standalone"))
$targetBuilds = [IO.Path]::GetFullPath((Join-Path $TargetRoot "standalone-builds"))
$targetDeliveries = [IO.Path]::GetFullPath((Join-Path $TargetRoot "deliveries"))
$utf8 = [Text.UTF8Encoding]::new($false, $true)

if (-not $sourceBuilds.StartsWith("D:\workspace\droneci\", [StringComparison]::OrdinalIgnoreCase)) {
    throw "Unexpected OneBuild source path: $sourceBuilds"
}
if (-not $targetBuilds.StartsWith("D:\nginx\app\builder-data\", [StringComparison]::OrdinalIgnoreCase)) {
    throw "Unexpected OneOps target path: $targetBuilds"
}

$active = @()
if (Test-Path -LiteralPath $sourceBuilds) {
    foreach ($metadata in Get-ChildItem -LiteralPath $sourceBuilds -Recurse -Filter "metadata.json") {
        $raw = [IO.File]::ReadAllText($metadata.FullName, $utf8)
        if ($raw -match '"status"\s*:\s*"(queued|running)"') {
            $jobId = if ($raw -match '"id"\s*:\s*"([^"]+)"') {
                $Matches[1]
            } else {
                $metadata.Directory.Name
            }
            $active += [string]$jobId
        }
    }
}
if ($active.Count -gt 0) {
    throw "Active OneBuild tasks must finish or be cancelled first: $($active -join ', ')"
}

New-Item -ItemType Directory -Force -Path $TargetRoot | Out-Null
if ((Test-Path -LiteralPath $sourceBuilds) -and (Test-Path -LiteralPath $targetBuilds)) {
    throw "Both source and target build-history directories exist."
}
if ((Test-Path -LiteralPath $sourceDeliveries) -and (Test-Path -LiteralPath $targetDeliveries)) {
    throw "Both source and target delivery directories exist."
}

if (Test-Path -LiteralPath $sourceBuilds) {
    Move-Item -LiteralPath $sourceBuilds -Destination $targetBuilds
}
if (Test-Path -LiteralPath $sourceDeliveries) {
    Move-Item -LiteralPath $sourceDeliveries -Destination $targetDeliveries
}

$replacements = [ordered]@{
    ($sourceBuilds.Replace("\", "\\")) = $targetBuilds.Replace("\", "\\")
    ($sourceDeliveries.Replace("\", "\\")) = $targetDeliveries.Replace("\", "\\")
}
$updated = 0
foreach ($metadata in Get-ChildItem -LiteralPath $targetBuilds -Recurse -Filter "metadata.json") {
    $raw = [IO.File]::ReadAllText($metadata.FullName, $utf8)
    $next = $raw
    foreach ($entry in $replacements.GetEnumerator()) {
        $next = $next.Replace([string]$entry.Key, [string]$entry.Value)
    }
    if ($next -ne $raw) {
        [IO.File]::WriteAllText($metadata.FullName, $next, $utf8)
        $updated += 1
    }
}

$jobCount = @(
    Get-ChildItem -LiteralPath $targetBuilds -Recurse -Filter "metadata.json"
).Count
$deliveryCount = @(
    Get-ChildItem -LiteralPath $targetDeliveries -Directory
).Count

[pscustomobject]@{
    SourceBuildsExists = Test-Path -LiteralPath $sourceBuilds
    SourceDeliveriesExists = Test-Path -LiteralPath $sourceDeliveries
    TargetBuilds = $targetBuilds
    TargetDeliveries = $targetDeliveries
    JobCount = $jobCount
    DeliveryCount = $deliveryCount
    MetadataUpdated = $updated
} | ConvertTo-Json -Compress
