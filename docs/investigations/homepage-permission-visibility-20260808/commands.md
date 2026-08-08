# 実行コマンド

作業ディレクトリ: `D:\nginx`

## 調査

```powershell
git fetch origin master
rg -n "dashboardReadable|fetchDashboard|subscribeDashboard|connection-card|snapshot\.upstream|summary" app/apps/portal-shell/src/App.tsx app/packages/api-client/src/index.ts app/gateway/server.mjs app/gateway/lib.mjs
```

## 実装確認

```powershell
git diff --check
& D:\nginx\runtime\node\node.exe --check app\gateway\server.mjs
& D:\nginx\runtime\node\node.exe --check app\gateway\lib.mjs
```

## テスト

```powershell
& D:\nginx\runtime\node\node.exe --test app\gateway\lib.test.mjs
& D:\nginx\runtime\node\pnpm.cmd --filter @one-ops/portal-shell test
& D:\nginx\runtime\node\pnpm.cmd --filter @one-ops/portal-shell build
```

## 公開後に実行する確認

```powershell
& D:\nginx\runtime\node\pnpm.cmd test
& D:\nginx\runtime\node\pnpm.cmd build
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File app\scripts\publish-portal.ps1
Invoke-RestMethod -Uri http://127.0.0.1:8092/api/work-center/v1/health
```

Browser では、代理ログインした閲覧者の権限を一つずつ変更し、画面表示、Network の dashboard と events、Console、スクリーンショットを記録する。
