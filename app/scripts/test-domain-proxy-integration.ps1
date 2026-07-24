param(
    [string]$PackageRoot = "D:\nginx\deploy\oneops-domain-proxy"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$testRootBase = Join-Path (Split-Path -Parent $PSScriptRoot) ".test-work"
$testRoot = Join-Path $testRootBase ("domain-proxy-" + [Guid]::NewGuid().ToString("N"))
$resolvedTestRoot = [IO.Path]::GetFullPath($testRoot)
$resolvedBase = [IO.Path]::GetFullPath($testRootBase)
if (-not $resolvedTestRoot.StartsWith($resolvedBase, [StringComparison]::OrdinalIgnoreCase)) {
    throw "Invalid domain proxy test workspace."
}

$proxyScript = Join-Path $PackageRoot "OneOps.DomainProxy.ps1"
$configPath = Join-Path $PackageRoot "domain-proxy.json"
$config = Get-Content -Raw -LiteralPath $configPath | ConvertFrom-Json
$healthUri = ([string]$config.ListenPrefix).Replace("+", "127.0.0.1") + "health"
$ssoUri = ([string]$config.ListenPrefix).Replace("+", "127.0.0.1") +
    "api/work-center/v1/auth/sso/windows/begin?returnTo=%2F"

New-Item -ItemType Directory -Force -Path $testRoot | Out-Null
$stdout = Join-Path $testRoot "stdout.log"
$stderr = Join-Path $testRoot "stderr.log"
$process = Start-Process `
    -FilePath "powershell.exe" `
    -ArgumentList @(
        "-NoProfile",
        "-NonInteractive",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        $proxyScript,
        "-ConfigPath",
        $configPath
    ) `
    -WorkingDirectory $PackageRoot `
    -WindowStyle Hidden `
    -RedirectStandardOutput $stdout `
    -RedirectStandardError $stderr `
    -PassThru

try {
    $deadline = (Get-Date).AddSeconds(15)
    $health = $null
    do {
        Start-Sleep -Milliseconds 250
        try {
            $health = Invoke-RestMethod -Uri $healthUri -TimeoutSec 2
        }
        catch {
            $health = $null
        }
    } while (-not $health -and (Get-Date) -lt $deadline)
    if (-not $health -or $health.status -ne "UP") {
        $errorLog = Get-Content -Raw -LiteralPath $stderr -ErrorAction SilentlyContinue
        throw "Domain proxy health integration test failed. $errorLog"
    }

    $request = [Net.HttpWebRequest]::Create($ssoUri)
    $request.AllowAutoRedirect = $false
    $request.Method = "GET"
    $statusCode = 0
    try {
        $response = $request.GetResponse()
        try {
            $statusCode = [int]$response.StatusCode
        }
        finally {
            $response.Dispose()
        }
    }
    catch [Net.WebException] {
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
            $_.Exception.Response.Dispose()
        }
        else {
            throw
        }
    }
    if ($statusCode -ne 401) {
        throw "Expected an unauthenticated 401 response, received $statusCode."
    }

    [pscustomobject]@{
        Passed = $true
        Health = $health.status
        DomainJoined = [bool]$health.domainJoined
        UnauthenticatedStatus = $statusCode
    } | ConvertTo-Json
}
finally {
    if ($process -and -not $process.HasExited) {
        Stop-Process -Id $process.Id -Force
        $process.WaitForExit()
    }
    if (Test-Path -LiteralPath $resolvedTestRoot) {
        Remove-Item -LiteralPath $resolvedTestRoot -Recurse -Force
    }
}
