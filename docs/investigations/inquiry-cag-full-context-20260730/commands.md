# 実行コマンド

```powershell
D:\nginx\runtime\node\node.exe --test app\gateway\ai-assistant.test.mjs
$env:Path = 'D:\nginx\runtime\node;' + $env:Path
Set-Location D:\nginx\app
pnpm --filter @one-ops/portal-shell test
pnpm --filter @one-ops/portal-shell build
pnpm check
Set-Location D:\nginx
powershell.exe -NoProfile -ExecutionPolicy Bypass -File app\scripts\publish-portal.ps1 -Reason inquiry-cag-full-context-v0.6.3
D:\nginx\nginx.exe -t -p D:\nginx
Invoke-RestMethod http://127.0.0.1:8092/api/work-center/v1/health
Invoke-WebRequest https://192.168.20.54/api/work-center/v1/health -SkipCertificateCheck
```
