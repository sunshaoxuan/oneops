param(
    [string]$AppRoot = "D:\nginx\app",
    [int]$IntervalSeconds = 30,
    [switch]$SelfTest
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

if ($SelfTest) {
    [pscustomobject]@{
        Valid = $IntervalSeconds -ge 10
        IntervalSeconds = $IntervalSeconds
        UsesOneShotRecovery = $true
    } | ConvertTo-Json -Compress
    exit 0
}

if ($IntervalSeconds -lt 10) {
    throw "Runtime supervisor interval must be at least 10 seconds."
}

$ensureScript = Join-Path $PSScriptRoot "ensure-oneops-runtime.ps1"
$logRoot = Join-Path $AppRoot "logs"
$logPath = Join-Path $logRoot "runtime-supervisor.log"
New-Item -ItemType Directory -Force -Path $logRoot | Out-Null

function Write-SupervisorLog {
    param([string]$Message)

    if (
        (Test-Path -LiteralPath $logPath) -and
        (Get-Item -LiteralPath $logPath).Length -ge 5MB
    ) {
        $archivePath = "$logPath.previous"
        Move-Item `
            -LiteralPath $logPath `
            -Destination $archivePath `
            -Force
    }
    Add-Content `
        -LiteralPath $logPath `
        -Value "$(Get-Date -Format o) $Message" `
        -Encoding UTF8
}

Write-SupervisorLog "runtime_supervisor_started"

$lastHeartbeat = [DateTime]::MinValue
while ($true) {
    try {
        & $ensureScript -AppRoot $AppRoot | Out-Null
        if (((Get-Date) - $lastHeartbeat).TotalHours -ge 1) {
            Write-SupervisorLog "runtime_healthy"
            $lastHeartbeat = Get-Date
        }
    }
    catch {
        Write-SupervisorLog `
            "supervisor_cycle_failed error=$($_.Exception.Message)"
    }
    Start-Sleep -Seconds $IntervalSeconds
}
