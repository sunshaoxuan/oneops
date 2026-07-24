$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$appRoot = Join-Path $projectRoot "app"
$nodeExecutable = Join-Path $projectRoot "runtime\node\node.exe"
$environmentFile = Join-Path $appRoot ".env.local"
$gatewayEntry = Join-Path $appRoot "gateway\server.mjs"
$databaseContainerName = "onehr-operations-postgres"
$databaseVolumeName = "onehr-operations-postgres-data"

docker volume inspect $databaseVolumeName *> $null
if ($LASTEXITCODE -ne 0) {
  docker volume create $databaseVolumeName | Out-Null
}

docker container inspect $databaseContainerName *> $null
if ($LASTEXITCODE -eq 0) {
  $databaseRunning = docker inspect `
    --format "{{.State.Running}}" `
    $databaseContainerName
  if ($databaseRunning -ne "true") {
    docker start $databaseContainerName | Out-Null
  }
} else {
  docker compose `
    --project-directory $appRoot `
    --env-file $environmentFile `
    up -d postgres
  if ($LASTEXITCODE -ne 0) {
    throw "Database startup failed"
  }
}

$gatewayRunning = Get-CimInstance Win32_Process |
  Where-Object {
    $_.ExecutablePath -eq $nodeExecutable -and
    $_.CommandLine -like "*$gatewayEntry*"
  }
if (-not $gatewayRunning) {
  Start-Process `
    -FilePath $nodeExecutable `
    -ArgumentList "--env-file=$environmentFile", $gatewayEntry `
    -WorkingDirectory $appRoot `
    -WindowStyle Hidden
}

$nginxRunning = Get-CimInstance Win32_Process |
  Where-Object {
    $_.Name -eq "nginx.exe" -and
    $_.ExecutablePath -eq (Join-Path $projectRoot "nginx.exe")
  }
if (-not $nginxRunning) {
  Start-Process `
    -FilePath (Join-Path $projectRoot "nginx.exe") `
    -ArgumentList "-p", "$($projectRoot.Replace('\', '/'))/", "-c", "conf/nginx.conf" `
    -WorkingDirectory $projectRoot `
    -WindowStyle Hidden
}
