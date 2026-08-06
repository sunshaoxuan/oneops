param(
    [string]$AppRoot = "D:\nginx\app",
    [string]$DockerDesktopPath = "C:\Program Files\Docker\Docker\Docker Desktop.exe",
    [string]$DockerCliPath = "C:\Program Files\Docker\Docker\resources\bin\docker.exe",
    [string]$DatabaseContainerName = "onehr-operations-postgres",
    [string]$DatabaseVolumeName = "onehr-operations-postgres-data",
    [string]$GatewayTaskName = "OneHR Operations Compat Gateway",
    [int]$DockerTimeoutSeconds = 180,
    [int]$DatabaseTimeoutSeconds = 120,
    [int]$GatewayTimeoutSeconds = 60,
    [switch]$SkipDockerDesktopLaunch,
    [switch]$SelfTest
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Set-OneOpsEnvironmentValue {
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

if ($SelfTest) {
    $sample = @(
        "OPS_DATABASE_URL=postgres://example",
        "OPS_SSO_AUTO_LOGIN=true",
        "OPS_ENVPORTAL_SSO_URL=http://old.example/sso",
        "OPS_ENVPORTAL_PROFILE_URL=http://old.example/profile",
        "OPS_WINDOWS_SSO_PROXY_URL=http://old.example/proxy",
        "OPS_SSO_SHARED_SECRET=preserve"
    )
    $updated = Set-OneOpsEnvironmentValue `
        -Lines $sample `
        -Name "OPS_ENVPORTAL_SSO_URL" `
        -Value ""
    $updated = Set-OneOpsEnvironmentValue `
        -Lines $updated `
        -Name "OPS_ENVPORTAL_PROFILE_URL" `
        -Value ""
    $updated = Set-OneOpsEnvironmentValue `
        -Lines $updated `
        -Name "OPS_WINDOWS_SSO_PROXY_URL" `
        -Value ""
    $updated = Set-OneOpsEnvironmentValue `
        -Lines $updated `
        -Name "OPS_SSO_AUTO_LOGIN" `
        -Value "false"
    $valid = (
        $updated.Count -eq 6 -and
        $updated[0] -eq $sample[0] -and
        $updated[1] -eq "OPS_SSO_AUTO_LOGIN=false" -and
        $updated[2] -eq "OPS_ENVPORTAL_SSO_URL=" -and
        $updated[3] -eq "OPS_ENVPORTAL_PROFILE_URL=" -and
        $updated[4] -eq "OPS_WINDOWS_SSO_PROXY_URL=" -and
        $updated[5] -eq $sample[5]
    )
    [pscustomobject]@{
        Valid = $valid
        LocalLoginRestored = $updated[1] -eq "OPS_SSO_AUTO_LOGIN=false"
        EnvPortalSsoDisabled = $updated[2] -eq "OPS_ENVPORTAL_SSO_URL="
        EnvPortalProfileDisabled = $updated[3] -eq "OPS_ENVPORTAL_PROFILE_URL="
        WindowsSsoProxyDisabled = $updated[4] -eq "OPS_WINDOWS_SSO_PROXY_URL="
        SecretPreserved = $updated[5] -eq $sample[5]
        ProtectedVolumeName = $DatabaseVolumeName
    } | ConvertTo-Json -Compress
    exit 0
}

$resolvedAppRoot = [IO.Path]::GetFullPath($AppRoot)
$nginxRoot = Split-Path -Parent $resolvedAppRoot
$environmentPath = Join-Path $resolvedAppRoot ".env.local"
$composePath = Join-Path $resolvedAppRoot "compose.yaml"
$logRoot = Join-Path $resolvedAppRoot "logs"
$logPath = Join-Path $logRoot "runtime-supervisor.log"
New-Item -ItemType Directory -Force -Path $logRoot | Out-Null

if (-not (Test-Path -LiteralPath $environmentPath)) {
    throw "OneOps environment file was not found."
}
if (-not (Test-Path -LiteralPath $composePath)) {
    throw "OneOps compose file was not found."
}
if (-not (Test-Path -LiteralPath $DockerCliPath)) {
    $dockerCommand = Get-Command docker.exe -ErrorAction SilentlyContinue
    if (-not $dockerCommand) {
        throw "Docker CLI was not found."
    }
    $DockerCliPath = $dockerCommand.Source
}

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
    "Global\OneOpsRuntimeSupervisor",
    [ref]$createdNew,
    $mutexSecurity
)
if (-not $mutex.WaitOne(0)) {
    [pscustomobject]@{
        Ready = $false
        Skipped = $true
        Reason = "Another runtime recovery cycle is active."
    } | ConvertTo-Json -Compress
    exit 0
}
$deliveryCreatedNew = $false
$deliveryMutex = [Threading.Mutex]::new(
    $false,
    "Global\OneOpsContinuousDelivery",
    [ref]$deliveryCreatedNew,
    $mutexSecurity
)
if (-not $deliveryMutex.WaitOne(0)) {
    $deliveryMutex.Dispose()
    $mutex.ReleaseMutex()
    $mutex.Dispose()
    [pscustomobject]@{
        Ready = $false
        Skipped = $true
        Reason = "Continuous delivery is active."
    } | ConvertTo-Json -Compress
    exit 0
}

function Write-RuntimeLog {
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

function Test-DockerReady {
    $previousErrorActionPreference = $ErrorActionPreference
    try {
        $ErrorActionPreference = "SilentlyContinue"
        & $DockerCliPath info --format "{{.ServerVersion}}" *> $null
        return $LASTEXITCODE -eq 0
    }
    finally {
        $ErrorActionPreference = $previousErrorActionPreference
    }
}

function Wait-DockerReady {
    $deadline = (Get-Date).AddSeconds($DockerTimeoutSeconds)
    do {
        if (Test-DockerReady) {
            return
        }
        Start-Sleep -Seconds 2
    } while ((Get-Date) -lt $deadline)

    throw "Docker Desktop did not become ready."
}

function Ensure-DockerReady {
    if (Test-DockerReady) {
        return
    }

    $service = Get-Service -Name "com.docker.service" -ErrorAction SilentlyContinue
    if ($service -and $service.Status -ne "Running") {
        Start-Service -Name "com.docker.service"
        Write-RuntimeLog "docker_service_started"
    }
    if (-not $SkipDockerDesktopLaunch) {
        if (-not (Test-Path -LiteralPath $DockerDesktopPath)) {
            throw "Docker Desktop executable was not found."
        }
        $desktopStartExitCode = -1
        $previousErrorActionPreference = $ErrorActionPreference
        try {
            $ErrorActionPreference = "SilentlyContinue"
            & $DockerCliPath desktop start *> $null
            $desktopStartExitCode = $LASTEXITCODE
        }
        finally {
            $ErrorActionPreference = $previousErrorActionPreference
        }
        if (
            $desktopStartExitCode -ne 0 -and
            -not (Get-Process "Docker Desktop" -ErrorAction SilentlyContinue)
        ) {
            Start-Process `
                -FilePath $DockerDesktopPath `
                -WindowStyle Hidden
        }
        Write-RuntimeLog "docker_desktop_start_requested"
    }
    Wait-DockerReady
}

function Invoke-Docker {
    param([string[]]$Arguments)

    $output = & $DockerCliPath @Arguments 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Docker command failed: $($Arguments -join ' ')"
    }
    return $output
}

function Ensure-DatabaseReady {
    & $DockerCliPath volume inspect $DatabaseVolumeName *> $null
    if ($LASTEXITCODE -ne 0) {
        throw "Protected OneOps database volume is missing: $DatabaseVolumeName"
    }

    & $DockerCliPath container inspect $DatabaseContainerName *> $null
    if ($LASTEXITCODE -eq 0) {
        $running = (
            Invoke-Docker -Arguments @(
                "inspect",
                "--format",
                "{{.State.Running}}",
                $DatabaseContainerName
            )
        ).Trim()
        if ($running -ne "true") {
            Invoke-Docker -Arguments @("start", $DatabaseContainerName) | Out-Null
            Write-RuntimeLog "database_container_started"
        }
    }
    else {
        Invoke-Docker -Arguments @(
            "compose",
            "--project-directory",
            $resolvedAppRoot,
            "--env-file",
            $environmentPath,
            "up",
            "-d",
            "postgres"
        ) | Out-Null
        Write-RuntimeLog "database_container_recreated_with_protected_volume"
    }

    $deadline = (Get-Date).AddSeconds($DatabaseTimeoutSeconds)
    do {
        $health = (
            & $DockerCliPath inspect `
                "--format" `
                "{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}" `
                $DatabaseContainerName 2>$null
        )
        if ($LASTEXITCODE -eq 0 -and $health.Trim() -eq "healthy") {
            return
        }
        Start-Sleep -Seconds 2
    } while ((Get-Date) -lt $deadline)

    throw "OneOps PostgreSQL did not become healthy."
}

function Enable-LocalLogin {
    $lines = @(Get-Content -LiteralPath $environmentPath)
    $updated = Set-OneOpsEnvironmentValue `
        -Lines $lines `
        -Name "OPS_ENVPORTAL_SSO_URL" `
        -Value ""
    $updated = Set-OneOpsEnvironmentValue `
        -Lines $updated `
        -Name "OPS_ENVPORTAL_PROFILE_URL" `
        -Value ""
    $updated = Set-OneOpsEnvironmentValue `
        -Lines $updated `
        -Name "OPS_WINDOWS_SSO_PROXY_URL" `
        -Value ""
    $updated = Set-OneOpsEnvironmentValue `
        -Lines $updated `
        -Name "OPS_SSO_AUTO_LOGIN" `
        -Value "false"
    if (($updated -join "`n") -eq ($lines -join "`n")) {
        return $false
    }

    $pendingPath = "$environmentPath.next"
    [IO.File]::WriteAllLines(
        $pendingPath,
        $updated,
        [Text.UTF8Encoding]::new($false)
    )
    Move-Item `
        -LiteralPath $pendingPath `
        -Destination $environmentPath `
        -Force
    Write-RuntimeLog "local_login_configuration_restored"
    return $true
}

function Get-AuthConfig {
    try {
        return Invoke-RestMethod `
            -Uri "http://127.0.0.1:8092/api/work-center/v1/auth/config" `
            -TimeoutSec 3
    }
    catch {
        return $null
    }
}

function Test-AuthConfig {
    param($Config)

    return (
        $Config -and
        $Config.windowsSsoEnabled -eq $false -and
        $Config.windowsSsoAutoLogin -eq $false -and
        [string]$Config.windowsSsoUrl -eq ""
    )
}

function Wait-GatewayStopped {
    $deadline = (Get-Date).AddSeconds(20)
    do {
        $listeners = @(
            Get-NetTCPConnection `
                -LocalAddress "127.0.0.1" `
                -LocalPort 8092 `
                -State Listen `
                -ErrorAction SilentlyContinue
        )
        if ($listeners.Count -eq 0) {
            return
        }
        Start-Sleep -Milliseconds 250
    } while ((Get-Date) -lt $deadline)

    throw "OneOps Gateway did not release port 8092."
}

function Ensure-GatewayReady {
    param([bool]$ForceRestart)

    if (-not $ForceRestart -and (Test-AuthConfig -Config (Get-AuthConfig))) {
        return
    }

    $task = Get-ScheduledTask `
        -TaskName $GatewayTaskName `
        -ErrorAction Stop
    if ([string]$task.State -eq "Running") {
        Stop-ScheduledTask -TaskName $GatewayTaskName
        Wait-GatewayStopped
    }
    Start-ScheduledTask -TaskName $GatewayTaskName
    Write-RuntimeLog "gateway_task_started"

    $deadline = (Get-Date).AddSeconds($GatewayTimeoutSeconds)
    do {
        $config = Get-AuthConfig
        if (Test-AuthConfig -Config $config) {
            return
        }
        Start-Sleep -Seconds 1
    } while ((Get-Date) -lt $deadline)

    throw "OneOps Gateway did not expose local login readiness."
}

function Ensure-NginxReady {
    $nginxExecutable = Join-Path $nginxRoot "nginx.exe"
    $nginxProcess = Get-CimInstance Win32_Process |
        Where-Object {
            $_.Name -eq "nginx.exe" -and
            $_.ExecutablePath -eq $nginxExecutable
        }
    if (-not $nginxProcess) {
        Start-Process `
            -FilePath $nginxExecutable `
            -ArgumentList "-p", "$($nginxRoot.Replace('\', '/'))/", "-c", "conf/nginx.conf" `
            -WorkingDirectory $nginxRoot `
            -WindowStyle Hidden
        Write-RuntimeLog "nginx_started"
    }

    $deadline = (Get-Date).AddSeconds(20)
    do {
        & curl.exe `
            -k `
            -f `
            -sS `
            -o NUL `
            "https://192.168.20.54/" *> $null
        if ($LASTEXITCODE -eq 0) {
            return
        }
        Start-Sleep -Seconds 1
    } while ((Get-Date) -lt $deadline)

    throw "OneOps HTTPS entry did not become ready."
}

try {
    Ensure-DockerReady
    Ensure-DatabaseReady
    $loginChanged = Enable-LocalLogin
    Ensure-GatewayReady -ForceRestart $loginChanged
    Ensure-NginxReady
    $config = Get-AuthConfig
    [pscustomobject]@{
        Ready = $true
        Docker = $true
        Database = "healthy"
        Gateway = [string](Get-ScheduledTask -TaskName $GatewayTaskName).State
        AuthenticationMode = "LOCAL"
        AutomaticSso = [bool]$config.windowsSsoAutoLogin
        Https = $true
    } | ConvertTo-Json
}
catch {
    Write-RuntimeLog "runtime_recovery_failed error=$($_.Exception.Message)"
    throw
}
finally {
    $deliveryMutex.ReleaseMutex()
    $deliveryMutex.Dispose()
    $mutex.ReleaseMutex()
    $mutex.Dispose()
}
