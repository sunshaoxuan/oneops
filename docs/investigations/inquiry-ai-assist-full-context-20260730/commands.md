# 実行コマンド

```powershell
D:\nginx\runtime\node\node.exe --test app\gateway\inquiry-support.test.mjs
$env:Path = 'D:\nginx\runtime\node;' + $env:Path
Set-Location D:\nginx\app
pnpm check
Set-Location D:\nginx
powershell.exe -NoProfile -ExecutionPolicy Bypass -File app\scripts\publish-portal.ps1 -Reason inquiry-ai-assist-full-context-v0.6.4
Invoke-RestMethod http://127.0.0.1:8092/api/work-center/v1/health
Invoke-WebRequest https://192.168.20.54/api/work-center/v1/health -SkipCertificateCheck
```
