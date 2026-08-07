# 実行コマンド

```powershell
rg -n -i "DELETE FROM role_permissions|TRUNCATE|DROP TABLE.*role_permissions|role_permissions" app
Get-ScheduledTask -TaskName "OneHR Operations Compat Gateway"
Get-NetTCPConnection -LocalPort 8092,8093 -State Listen
docker volume inspect onehr-operations-postgres-data
```

```powershell
& "D:\nginx\runtime\node\pnpm.cmd" test
& ".\mvnw.cmd" "-q" "test"
```

PostgreSQL 統合試験では `.env.local` の接続値を試験 Process の環境変数へ限定して設定した。パスワード、暗号鍵、トークンは記録へ出力していない。
