# 実行 Command

```powershell
D:\nginx\runtime\node\pnpm.cmd exec vitest run src/auth-ui.test.ts
D:\nginx\runtime\node\pnpm.cmd check
D:\nginx\app\backend\mvnw.cmd test
C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe -NoProfile -ExecutionPolicy Bypass -File D:\nginx\app\scripts\test-operations-scripts.ps1
D:\nginx\runtime\node\node.exe --test D:\nginx\app\gateway\project-language.test.mjs
C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe -NoProfile -ExecutionPolicy Bypass -File D:\nginx\app\scripts\publish-portal.ps1 -Reason windows-account-auth-label-0.16.2
Get-CimInstance Win32_Process -Filter "Name='nginx.exe'"
Get-Content D:\nginx\logs\nginx.pid
Start-ScheduledTask -TaskName "Nginx HTTPS Gateway"
D:\nginx\nginx.exe -t -p D:\nginx
Invoke-RestMethod https://192.168.20.54/api/work-center/v1/health -SkipCertificateCheck
```

正式配信の最終実行は `D:\nginx\app\.continuous-delivery.trigger` を通して SYSTEM の `OneOps Continuous Delivery` Task が処理した。Trigger File は配信後に削除した。
