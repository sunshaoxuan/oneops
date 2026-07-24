# 验证命令

日期：2026-07-24

## 自动测试与生产构建

```powershell
$env:Path = "D:\nginx\runtime\node;$env:Path"
Set-Location D:\nginx\app
pnpm check
```
## 原构筑器回归测试

```powershell
$env:PYTHONPATH = "D:\nginx\app\builder"
D:\nginx\runtime\python\python.exe -m pytest `
  D:\workspace\droneci\tests\test_host_standalone_console.py `
  -q `
  --rootdir=D:\nginx\app\builder `
  -k "not default_host_console_bind_is_fixed and not host_console_displays_app_version and not start_script_stops_process_occupying_fixed_port"
```

## 运维脚本测试

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass `
  -File D:\nginx\app\scripts\test-operations-scripts.ps1
```

## 发布

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass `
  -File D:\nginx\app\scripts\publish-portal.ps1 `
  -Reason refine-builder-oneops-workspace
```

## Nginx、健康状态和监听

```powershell
D:\nginx\nginx.exe -t -p D:\nginx
Invoke-RestMethod http://127.0.0.1:8092/api/work-center/v1/health
Get-NetTCPConnection -State Listen |
  Where-Object { $_.LocalPort -in 443,8091,8092 }
```

## 历史数据严格 UTF-8 检查

```powershell
$records = Get-ChildItem D:\nginx\app\builder-data\standalone-builds -Directory |
  Where-Object Name -Match '^\d{14}$' |
  ForEach-Object {
    [IO.File]::ReadAllText(
      (Join-Path $_.FullName 'metadata.json'),
      [Text.UTF8Encoding]::new($false, $true)
    ) | ConvertFrom-Json
  }
```
