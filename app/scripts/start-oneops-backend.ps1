param(
    [string]$AppRoot = "D:\nginx\app",
    [string]$JavaExecutable = "D:\nginx\runtime\java\bin\java.exe"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$backendRoot = Join-Path $AppRoot "backend"
$jarPath = Join-Path $backendRoot "target\oneops-backend.jar"
$envPath = Join-Path $AppRoot ".env.local"
if (-not (Test-Path -LiteralPath $jarPath)) {
    throw "Spring Boot JAR が見つかりません: $jarPath"
}
if (-not (Test-Path -LiteralPath $envPath)) {
    throw "環境設定ファイルが見つかりません: $envPath"
}
if (-not (Test-Path -LiteralPath $JavaExecutable)) {
    $installedJava = Get-ChildItem "C:\Program Files\Eclipse Adoptium" -Recurse -Filter java.exe -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName
    if ($installedJava) {
        $JavaExecutable = $installedJava
    }
    else {
        throw "Java Runtime が見つかりません: $JavaExecutable"
    }
}

foreach ($line in Get-Content -LiteralPath $envPath) {
    if ($line -match '^\s*#' -or $line -notmatch '^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)$') {
        continue
    }
    $name = $Matches[1]
    $value = $Matches[2]
    if ($value.Length -ge 2 -and $value.StartsWith('"') -and $value.EndsWith('"')) {
        $value = $value.Substring(1, $value.Length - 2)
    }
    [Environment]::SetEnvironmentVariable($name, $value, "Process")
}

$databaseUrl = [Environment]::GetEnvironmentVariable("OPS_DATABASE_URL", "Process")
if ($databaseUrl -match '^postgres(?:ql)?://([^:/?#]+):([^@]+)@([^:/?#]+)(?::(\d+))?/(.+)$') {
    $databaseUser = [Uri]::UnescapeDataString($Matches[1])
    $databasePassword = [Uri]::UnescapeDataString($Matches[2])
    $databaseHost = $Matches[3]
    $databasePort = if ($Matches[4]) { $Matches[4] } else { "5432" }
    $databaseName = $Matches[5]
    [Environment]::SetEnvironmentVariable("OPS_DATABASE_JDBC_URL", "jdbc:postgresql://$databaseHost`:$databasePort/$databaseName", "Process")
    [Environment]::SetEnvironmentVariable("OPS_DATABASE_USER", $databaseUser, "Process")
    [Environment]::SetEnvironmentVariable("OPS_DATABASE_PASSWORD", $databasePassword, "Process")
}

[Environment]::SetEnvironmentVariable("OPS_GATEWAY_HOST", "127.0.0.1", "Process")
[Environment]::SetEnvironmentVariable("OPS_GATEWAY_PORT", "8092", "Process")
[Environment]::SetEnvironmentVariable("ONEOPS_LEGACY_GATEWAY_ENABLED", "true", "Process")
[Environment]::SetEnvironmentVariable("ONEOPS_LEGACY_GATEWAY_PORT", "8093", "Process")

Set-Location -LiteralPath $AppRoot
& $JavaExecutable "-Dfile.encoding=UTF-8" "-XX:+ExitOnOutOfMemoryError" -jar $jarPath
exit $LASTEXITCODE
