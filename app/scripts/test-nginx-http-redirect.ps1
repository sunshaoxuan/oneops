$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$appRoot = Split-Path -Parent -Path $PSScriptRoot
$nginxRoot = Split-Path -Parent -Path $appRoot
$configPath = Join-Path $nginxRoot "conf\nginx.conf"
$config = Get-Content -Raw -LiteralPath $configPath

$httpServerPattern = @'
(?ms)server\s*\{\s*
\s*listen\s+192\.168\.20\.54:80;\s*
\s*server_name\s+192\.168\.20\.54\s+TS2DEVSERVER\s+localhost;\s*
\s*return\s+308\s+https://\$host\$request_uri;\s*
\s*\}
'@

if ($config -notmatch $httpServerPattern) {
    throw "HTTP 80 must redirect every request to the same HTTPS host, path and query."
}

if ($config -match 'return\s+30[178]\s+https://\$http_host\$request_uri') {
    throw "HTTP redirect must not preserve the source :80 authority."
}

$httpListenCount = [regex]::Matches(
    $config,
    '(?m)^\s*listen\s+192\.168\.20\.54:80;\s*$'
).Count
if ($httpListenCount -ne 1) {
    throw "Exactly one public HTTP 80 listener is required."
}

Write-Output "Nginx HTTP redirect contract passed."
