# 実行コマンド

1. `git fetch origin master`
2. `git rev-parse HEAD`
3. `git rev-parse origin/master`
4. `rg --files app docs`
5. `rg -n` による利用者、RBAC、問合支援、Spring 互換転送及び migration の固定文字列調査
6. `runtime/node/node.exe --test app/gateway/*.test.mjs`
7. `runtime/python/python.exe -m unittest app/builder/oneops_worker_test.py`
8. `runtime/node/pnpm.cmd --dir app/apps/portal-shell test`
9. `runtime/node/pnpm.cmd --dir app/apps/portal-shell build`
10. `app/backend/mvnw.cmd test`
11. `.env.local` の正式 Database 接続を試験 Process に限定して設定し、試験専用暗号鍵と `ONEOPS_DATABASE_INTEGRATION_TEST=true` を使用した `app/backend/mvnw.cmd -Dtest=WorkforcePolicyDatabaseTest test`
12. `app/backend/mvnw.cmd -DskipTests package`
13. `app/scripts/publish-portal.ps1 -Reason internal-workforce-0.9.1-rework`
14. `Invoke-RestMethod http://127.0.0.1:8092/api/work-center/v1/health`
15. Codex Browser による正式 Portal の部門、職責、利用者、テンプレート、問合支援、個人プロフィール、Console、Layout 及び Screenshot 検証
16. `docker exec onehr-operations-postgres ... psql` による一時受入利用者、Template、Binding の削除及び関連行 0 件監査
17. `git diff --check`
18. 秘密情報、Runtime Data、Log、Backup、`.codex-work` の Commit 除外監査
19. `git add`、`git commit`、`git tag v0.9.1`、`git push origin master`、`git push origin v0.9.1`
20. Push 後の `HEAD`、`origin/master`、`v0.9.1`、正式 Health、Portal Asset の一致確認
