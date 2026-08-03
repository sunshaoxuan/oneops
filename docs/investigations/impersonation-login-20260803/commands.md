# 実行コマンド

1. `rg -n "logout|profile|session|users|impersonat" app/apps/portal-shell/src app/gateway app/db/migrations`
2. `D:\nginx\runtime\node\node.exe --test gateway/auth-controller.test.mjs`
3. `D:\nginx\runtime\node\pnpm.cmd test`
4. `D:\nginx\runtime\node\pnpm.cmd build`
5. `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/publish-portal.ps1 -Reason impersonation-login-20260803`
6. `nginx.exe -t -p D:\nginx -c conf\nginx.conf`
