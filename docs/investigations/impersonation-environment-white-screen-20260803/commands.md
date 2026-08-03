# 実行コマンド

```powershell
rg -n "environment-inventory|impersonat" app logs
pnpm exec vitest run src/auth-session-state.test.ts src/EnvironmentPage.viewer.test.tsx
./mvnw.cmd -q -Dtest=ImpersonationEnvironmentApiDatabaseTest test
pnpm check
```

データベース試験では `.env.local` から接続設定をプロセス環境へ読み込み、秘密値を標準出力へ表示していません。
