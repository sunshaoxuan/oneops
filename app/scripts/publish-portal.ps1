param(
    [string]$AppRoot = "D:\nginx\app",
    [string]$DistRoot = "",
    [string]$WebRoot = "D:\nginx\html",
    [switch]$SkipChecks,
    [switch]$SkipRuntimeValidation,
    [switch]$SkipGatewayRestart,
    [switch]$SkipDeliveryLock,
    [ValidateRange(1, 65535)]
    [int]$CandidateGatewayPort = 8094,
    [ValidateRange(1, 65535)]
    [int]$CandidateLegacyGatewayPort = 8095,
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
$mutex = $null
if (-not $SkipDeliveryLock) {
    $mutexSecurity = [Security.AccessControl.MutexSecurity]::new()
    foreach ($sidValue in "S-1-5-18", "S-1-5-32-544") {
        $sid = [Security.Principal.SecurityIdentifier]::new($sidValue)
        $rule = [Security.AccessControl.MutexAccessRule]::new(
            $sid,
            [Security.AccessControl.MutexRights]::FullControl,
            [Security.AccessControl.AccessControlType]::Allow
        )
        [void]$mutexSecurity.AddAccessRule($rule)
    }
    $createdNew = $false
    $mutex = [Threading.Mutex]::new(
        $false,
        "Global\OneOpsContinuousDelivery",
        [ref]$createdNew,
        $mutexSecurity
    )
    if (-not $mutex.WaitOne([TimeSpan]::FromMinutes(5))) {
        throw "OneOps delivery could not acquire the runtime maintenance lock."
    }
}
$publishedIndex = $false
$indexBackup = $null
$pendingIndex = $null
$candidateStarted = $false
$trafficOnCandidate = $false
$upstreamPath = Join-Path $nginxRoot "conf\oneops-backend-upstream.conf"
$backendRoot = Join-Path $AppRoot "backend"
$rollingJarPath = Join-Path $backendRoot "target\oneops-backend-rolling.jar"
$rollingOriginalJarPath = "$rollingJarPath.original"
$primaryJarPath = Join-Path $backendRoot "target\oneops-backend.jar"
$primaryJarBackup = $null

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

function Wait-OneOpsHealth {
    param(
        [int]$Port,
        [int]$TimeoutSeconds = 30
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    do {
        try {
            $health = Invoke-RestMethod `
                -Uri "http://127.0.0.1:$Port/api/work-center/v1/health" `
                -TimeoutSec 2
            if ($health.status -eq "UP") {
                return $health
            }
        }
        catch {
        }
        Start-Sleep -Milliseconds 250
    } while ((Get-Date) -lt $deadline)

    throw "OneOps health validation failed on port $Port."
}

function Stop-OneOpsCandidate {
    $ports = @($CandidateGatewayPort, $CandidateLegacyGatewayPort)
    $processIds = @(
        $ports |
            ForEach-Object {
                Get-NetTCPConnection `
                    -LocalAddress "127.0.0.1" `
                    -LocalPort $_ `
                    -State Listen `
                    -ErrorAction SilentlyContinue
            } |
            Where-Object { $_ } |
            Select-Object -ExpandProperty OwningProcess -Unique
    )
    foreach ($processId in $processIds) {
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    }
    $script:candidateStarted = $false
}

function Set-OneOpsBackendUpstream {
    param([int]$Port)

    $previous = if (Test-Path -LiteralPath $upstreamPath) {
        Get-Content -Raw -LiteralPath $upstreamPath
    }
    else {
        "proxy_pass http://127.0.0.1:8092;`n"
    }
    $next = "$upstreamPath.next"
    try {
        [IO.File]::WriteAllText(
            $next,
            "proxy_pass http://127.0.0.1:$Port;`n",
            [Text.UTF8Encoding]::new($false)
        )
        Move-Item -LiteralPath $next -Destination $upstreamPath -Force
        Invoke-CheckedCommand -FilePath (Join-Path $nginxRoot "nginx.exe") -Arguments @(
            "-t",
            "-p",
            $nginxRoot
        ) -WorkingDirectory $nginxRoot
        Invoke-CheckedCommand -FilePath (Join-Path $nginxRoot "nginx.exe") -Arguments @(
            "-s",
            "reload",
            "-p",
            $nginxRoot
        ) -WorkingDirectory $nginxRoot
    }
    catch {
        [IO.File]::WriteAllText(
            $upstreamPath,
            $previous,
            [Text.UTF8Encoding]::new($false)
        )
        if (Test-Path -LiteralPath $next) {
            Remove-Item -LiteralPath $next -Force
        }
        throw
    }
}

function Start-OneOpsCandidate {
    foreach ($port in @($CandidateGatewayPort, $CandidateLegacyGatewayPort)) {
        $listener = Get-NetTCPConnection `
            -LocalAddress "127.0.0.1" `
            -LocalPort $port `
            -State Listen `
            -ErrorAction SilentlyContinue
        if ($listener) {
            throw "Rolling deployment candidate port $port is already in use."
        }
    }
    $startScript = Join-Path $AppRoot "scripts\start-oneops-backend.ps1"
    $arguments = @(
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        $startScript,
        "-AppRoot",
        $AppRoot,
        "-JarPath",
        $rollingJarPath,
        "-GatewayPort",
        [string]$CandidateGatewayPort,
        "-LegacyGatewayPort",
        [string]$CandidateLegacyGatewayPort
    )
    Start-Process `
        -FilePath "powershell.exe" `
        -ArgumentList $arguments `
        -WindowStyle Hidden | Out-Null
    $script:candidateStarted = $true
    [void](Wait-OneOpsHealth -Port $CandidateGatewayPort)
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
    if (-not $SkipRuntimeValidation -and -not $SkipGatewayRestart) {
        foreach ($rollingArtifact in @($rollingJarPath, $rollingOriginalJarPath)) {
            if (Test-Path -LiteralPath $rollingArtifact) {
                Remove-Item -LiteralPath $rollingArtifact -Force
            }
        }
        Invoke-CheckedCommand `
            -FilePath (Join-Path $AppRoot "backend\mvnw.cmd") `
            -Arguments @("-Prolling", "package") `
            -WorkingDirectory $backendRoot
        if (-not (Test-Path -LiteralPath $rollingJarPath)) {
            throw "Rolling deployment JAR was not created: $rollingJarPath"
        }
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

    if (-not $SkipRuntimeValidation) {
        Invoke-CheckedCommand -FilePath (Join-Path $nginxRoot "nginx.exe") -Arguments @(
            "-t",
            "-p",
            $nginxRoot
        ) -WorkingDirectory $nginxRoot
        if (-not $SkipGatewayRestart) {
            Start-OneOpsCandidate
            Set-OneOpsBackendUpstream -Port $CandidateGatewayPort
            $trafficOnCandidate = $true
            [void](Wait-OneOpsHealth -Port $CandidateGatewayPort)

            Move-Item -LiteralPath $pendingIndex -Destination $currentIndex -Force
            $publishedIndex = $true

            $gatewayTask = Get-ScheduledTask `
                -TaskName "OneHR Operations Compat Gateway" `
                -ErrorAction Stop
            if ([string]$gatewayTask.State -eq "Running") {
                Stop-ScheduledTask -TaskName "OneHR Operations Compat Gateway"
            }
            Wait-OneOpsGatewayStopped
            if (Test-Path -LiteralPath $primaryJarPath) {
                $primaryJarBackup = "$primaryJarPath.rollback.$([Guid]::NewGuid().ToString('N'))"
                Copy-Item -LiteralPath $primaryJarPath -Destination $primaryJarBackup -Force
            }
            $primaryJarNext = "$primaryJarPath.next"
            Copy-Item -LiteralPath $rollingJarPath -Destination $primaryJarNext -Force
            Move-Item -LiteralPath $primaryJarNext -Destination $primaryJarPath -Force
            Start-ScheduledTask -TaskName "OneHR Operations Compat Gateway"
            [void](Wait-OneOpsHealth -Port 8092)
            Set-OneOpsBackendUpstream -Port 8092
            $trafficOnCandidate = $false
            Stop-OneOpsCandidate
            if ($primaryJarBackup -and (Test-Path -LiteralPath $primaryJarBackup)) {
                Remove-Item -LiteralPath $primaryJarBackup -Force
                $primaryJarBackup = $null
            }
        }
        else {
            Move-Item -LiteralPath $pendingIndex -Destination $currentIndex -Force
            $publishedIndex = $true
            Write-DeliveryLog "gateway_restart_skipped reason=$Reason"
        }
        [void](Wait-OneOpsHealth -Port 8092)
        Invoke-CheckedCommand -FilePath "curl.exe" -Arguments @(
            "-k",
            "-f",
            "-sS",
            "-o",
            "NUL",
            "https://192.168.20.54/"
        ) -WorkingDirectory $nginxRoot
    }
    elseif (-not $publishedIndex) {
        Move-Item -LiteralPath $pendingIndex -Destination $currentIndex -Force
        $publishedIndex = $true
    }
    Write-DeliveryLog "delivery_succeeded reason=$Reason"
}
catch {
    $deliveryError = $_.Exception.Message
    $primaryHealthy = $false
    try {
        [void](Wait-OneOpsHealth -Port 8092 -TimeoutSeconds 3)
        $primaryHealthy = $true
    }
    catch {
    }
    if ($trafficOnCandidate -and $primaryHealthy) {
        Set-OneOpsBackendUpstream -Port 8092
        $trafficOnCandidate = $false
    }
    if (-not $trafficOnCandidate -and $candidateStarted) {
        Stop-OneOpsCandidate
    }
    if (-not $trafficOnCandidate -and $publishedIndex -and $indexBackup -and (Test-Path -LiteralPath $indexBackup)) {
        Copy-Item -LiteralPath $indexBackup -Destination (Join-Path $WebRoot "index.html") -Force
        Write-DeliveryLog "delivery_index_rolled_back reason=$Reason"
    }
    if ($trafficOnCandidate) {
        Write-DeliveryLog "delivery_degraded_candidate_kept reason=$Reason port=$CandidateGatewayPort"
    }
    Write-DeliveryLog "delivery_failed reason=$Reason error=$deliveryError"
    throw $deliveryError
}
finally {
    if ($pendingIndex -and (Test-Path -LiteralPath $pendingIndex)) {
        Remove-Item -LiteralPath $pendingIndex -Force
    }
    if (-not $candidateStarted -and -not $trafficOnCandidate) {
        foreach ($rollingArtifact in @($rollingJarPath, $rollingOriginalJarPath)) {
            if (Test-Path -LiteralPath $rollingArtifact) {
                Remove-Item -LiteralPath $rollingArtifact -Force
            }
        }
    }
    if ($indexBackup -and (Test-Path -LiteralPath $indexBackup)) {
        Remove-Item -LiteralPath $indexBackup -Force
    }
    if ($mutex) {
        $mutex.ReleaseMutex()
        $mutex.Dispose()
    }
}
