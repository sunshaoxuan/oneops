# 実行 Command

1. `docker info --format {{.ServerVersion}}`
2. `powershell.exe -File app/scripts/ensure-oneops-runtime.ps1 -AppRoot D:\nginx\app`
3. `powershell.exe -File app/scripts/test-operations-scripts.ps1`
4. `powershell.exe -File app/scripts/install-runtime-supervisor.ps1 -AppRoot D:\nginx\app`
5. `Get-ScheduledTask -TaskName 'OneOps Runtime Supervisor'`
6. `Invoke-RestMethod https://192.168.20.54/api/work-center/v1/health`
7. `Invoke-RestMethod https://192.168.20.54/api/work-center/v1/auth/config`
8. `Test-NetConnection OHR0067 -Port 8998`
9. `Test-NetConnection 192.168.20.38 -Port 8999`
