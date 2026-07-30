$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$appRoot = Join-Path $projectRoot "app"
$ensureScript = Join-Path $appRoot "scripts\ensure-oneops-runtime.ps1"

& $ensureScript -AppRoot $appRoot
