# 実行コマンド

```powershell
Get-ChildItem app\builder-data\standalone-builds -Directory
Invoke-RestMethod http://192.168.250.50:8090/api/builds
rg -n "tasks|dashboard|events" app\backend app\gateway app\apps\portal-shell\src
app\backend\mvnw.cmd '-Dtest=WorkbenchControllerTest,LegacyGatewayProxyTest' test
app\backend\mvnw.cmd test
runtime\node\pnpm.cmd check
Stop-ScheduledTask -TaskName 'OneHR Operations Compat Gateway'
app\backend\mvnw.cmd -DskipTests package
app\scripts\publish-portal.ps1 -SkipChecks -Reason 'workbench-recent-build-tasks-0.8.3'
```

秘密情報、認証情報、構築要求の詳細本文は証跡へ保存していません。
