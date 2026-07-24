param(
    [string]$OutputRoot = "D:\nginx\deploy\oneops-domain-proxy",
    [string]$ProxyUrl = "http://OHR0067:8997",
    [string]$TargetBaseUrl = "https://192.168.20.54/",
    [switch]$RotateSecret
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$appRoot = Split-Path -Parent $PSScriptRoot
$nginxRoot = Split-Path -Parent $appRoot
$resolvedOutput = [IO.Path]::GetFullPath($OutputRoot)
$allowedOutputRoot = [IO.Path]::GetFullPath((Join-Path $nginxRoot "deploy"))
if (-not $resolvedOutput.StartsWith($allowedOutputRoot, [StringComparison]::OrdinalIgnoreCase)) {
    throw "The domain proxy package must stay under D:\nginx\deploy."
}
New-Item -ItemType Directory -Force -Path $resolvedOutput | Out-Null

$proxySource = Join-Path $appRoot "domain-proxy\OneOps.DomainProxy.ps1"
$readmeSource = Join-Path $appRoot "domain-proxy\README.md"
$launcherSource = Join-Path $appRoot "domain-proxy\install-oneops-domain-proxy.cmd"
$installerSource = Join-Path $PSScriptRoot "install-domain-proxy.ps1"
Copy-Item -LiteralPath $proxySource -Destination (Join-Path $resolvedOutput "OneOps.DomainProxy.ps1") -Force
Copy-Item -LiteralPath $readmeSource -Destination (Join-Path $resolvedOutput "README.md") -Force
Copy-Item -LiteralPath $launcherSource -Destination (Join-Path $resolvedOutput "install-oneops-domain-proxy.cmd") -Force
Copy-Item -LiteralPath $installerSource -Destination (Join-Path $resolvedOutput "install-domain-proxy.ps1") -Force

$secretPath = Join-Path $resolvedOutput "shared-secret.txt"
if ($RotateSecret -or -not (Test-Path -LiteralPath $secretPath)) {
    $bytes = New-Object byte[] 48
    $generator = [Security.Cryptography.RandomNumberGenerator]::Create()
    try {
        $generator.GetBytes($bytes)
    }
    finally {
        $generator.Dispose()
    }
    $secret = [Convert]::ToBase64String($bytes).TrimEnd("=").Replace("+", "-").Replace("/", "_")
    [IO.File]::WriteAllText($secretPath, $secret, [Text.UTF8Encoding]::new($false))
}
& icacls.exe $secretPath /inheritance:r | Out-Null
& icacls.exe $secretPath /grant:r "*S-1-5-18:(F)" "*S-1-5-32-544:(F)" | Out-Null

$listenPort = ([Uri]$ProxyUrl).Port
$config = [ordered]@{
    ListenPrefix = "http://+:$listenPort/"
    TargetBaseUrl = $TargetBaseUrl
    SharedSecretFile = "shared-secret.txt"
    AllowedUpnDomains = @("onehr.jp")
    AllowInvalidTargetCertificate = $true
}
[IO.File]::WriteAllText(
    (Join-Path $resolvedOutput "domain-proxy.json"),
    ($config | ConvertTo-Json -Depth 4),
    [Text.UTF8Encoding]::new($false)
)

$zipPath = "$resolvedOutput.zip"
if (Test-Path -LiteralPath $zipPath) {
    Remove-Item -LiteralPath $zipPath -Force
}
Compress-Archive -Path (Join-Path $resolvedOutput "*") -DestinationPath $zipPath -CompressionLevel Optimal

[pscustomobject]@{
    OutputRoot = $resolvedOutput
    ZipPath = $zipPath
    ProxyUrl = $ProxyUrl
    SecretPath = $secretPath
} | ConvertTo-Json
