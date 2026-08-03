param(
    [string]$AppRoot = "D:\nginx\app",
    [string]$DistRoot = "",
    [string]$WebRoot = "D:\nginx\html",
    [switch]$SkipChecks,
    [switch]$SkipRuntimeValidation,
    [switch]$SkipGatewayRestart,
    [string]$Reason = "manual"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

if (-not $DistRoot) {
    $DistRoot = Join-Path $AppRoot "apps\portal-shell\dist"
}
$nginxRoot = Split-Path -Parent $AppRoot
$logRoot = Join-Path $AppRoot "logs"
New-Item -ItemType Directory -Force -Path $logRoot | Out-Null
$logPath = Join-Path $logRoot "continuous-delivery.log"
$createdNew = $false
$mutex = [Threading.Mutex]::new($false, "Global\OneOpsContinuousDelivery", [ref]$createdNew)
if (-not $mutex.WaitOne([TimeSpan]::FromMinutes(5))) {
    throw "OneOps delivery could not acquire the runtime maintenance lock."
}
$publishedIndex = $false
$indexBackup = $null

function Write-DeliveryLog {
    param([string]$Message)
    $line = "$(Get-Date -Format o) $Message"
    Add-Content -LiteralPath $logPath -Value $line -Encoding UTF8
    Write-Output $line
}

function Invoke-CheckedCommand {
    param(
        [string]$FilePath,
        [string[]]$Arguments,
        [string]$WorkingDirectory
    )
    Push-Location $WorkingDirectory
    try {
        & $FilePath @Arguments
        if ($LASTEXITCODE -ne 0) {
            throw "$FilePath failed with exit code $LASTEXITCODE."
        }
    }
    finally {
        Pop-Location
    }
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

try {
    Write-DeliveryLog "delivery_started reason=$Reason"
    if (-not $SkipChecks) {
        $pnpm = Join-Path $nginxRoot "runtime\node\pnpm.cmd"
        if (-not (Test-Path -LiteralPath $pnpm)) {
            throw "Bundled pnpm runtime was not found: $pnpm"
        }
        Invoke-CheckedCommand -FilePath $pnpm -Arguments @("check") -WorkingDirectory $AppRoot
    }
    $indexSource = Join-Path $DistRoot "index.html"
    if (-not (Test-Path -LiteralPath $indexSource)) {
        throw "Built portal index was not found."
    }
    $indexContent = Get-Content -Raw -LiteralPath $indexSource
    $assetMatches = [regex]::Matches($indexContent, "/assets/[^`"']+")
    if ($assetMatches.Count -eq 0) {
        throw "Built portal index has no hashed assets."
    }
    foreach ($match in $assetMatches) {
        $assetPath = Join-Path $DistRoot $match.Value.TrimStart("/")
        if (-not (Test-Path -LiteralPath $assetPath)) {
            throw "Referenced asset was not found: $assetPath"
        }
    }
    New-Item -ItemType Directory -Force -Path $WebRoot | Out-Null
    $currentIndex = Join-Path $WebRoot "index.html"
    if (Test-Path -LiteralPath $currentIndex) {
        $indexBackup = Join-Path $WebRoot ("index.html.rollback." + [Guid]::NewGuid().ToString("N"))
        Copy-Item -LiteralPath $currentIndex -Destination $indexBackup -Force
    }
    foreach ($item in Get-ChildItem -LiteralPath $DistRoot) {
        if ($item.Name -eq "index.html") {
            continue
        }
        Copy-Item -LiteralPath $item.FullName -Destination $WebRoot -Recurse -Force
    }
    $pendingIndex = Join-Path $WebRoot "index.html.next"
    Copy-Item -LiteralPath $indexSource -Destination $pendingIndex -Force
    Move-Item -LiteralPath $pendingIndex -Destination $currentIndex -Force
    $publishedIndex = $true

    if (-not $SkipRuntimeValidation) {
        Invoke-CheckedCommand -FilePath (Join-Path $nginxRoot "nginx.exe") -Arguments @(
            "-t",
            "-p",
            $nginxRoot
        ) -WorkingDirectory $nginxRoot
        if (-not $SkipGatewayRestart) {
            $gatewayTask = Get-ScheduledTask `
                -TaskName "OneHR Operations Compat Gateway" `
                -ErrorAction Stop
            if ([string]$gatewayTask.State -eq "Running") {
                Stop-ScheduledTask -TaskName "OneHR Operations Compat Gateway"
            }
            Wait-OneOpsGatewayStopped
            Start-ScheduledTask -TaskName "OneHR Operations Compat Gateway"
        }
        else {
            Write-DeliveryLog "gateway_restart_skipped reason=$Reason"
        }
        $deadline = (Get-Date).AddSeconds(20)
        $health = $null
        do {
            Start-Sleep -Milliseconds 250
            try {
                $health = Invoke-RestMethod -Uri "http://127.0.0.1:8092/api/work-center/v1/health" -TimeoutSec 2
            }
            catch {
                $health = $null
            }
        } while (-not $health -and (Get-Date) -lt $deadline)
        if (-not $health -or $health.status -ne "UP") {
            throw "Gateway health validation failed after deployment."
        }
        Invoke-CheckedCommand -FilePath "curl.exe" -Arguments @(
            "-k",
            "-f",
            "-sS",
            "-o",
            "NUL",
            "https://192.168.20.54/"
        ) -WorkingDirectory $nginxRoot
    }
    Write-DeliveryLog "delivery_succeeded reason=$Reason"
}
catch {
    if ($publishedIndex -and $indexBackup -and (Test-Path -LiteralPath $indexBackup)) {
        Copy-Item -LiteralPath $indexBackup -Destination (Join-Path $WebRoot "index.html") -Force
        Write-DeliveryLog "delivery_index_rolled_back reason=$Reason"
    }
    Write-DeliveryLog "delivery_failed reason=$Reason error=$($_.Exception.Message)"
    throw
}
finally {
    if ($indexBackup -and (Test-Path -LiteralPath $indexBackup)) {
        Remove-Item -LiteralPath $indexBackup -Force
    }
    $mutex.ReleaseMutex()
    $mutex.Dispose()
}
