# 実行コマンド

```text
git status --short
git rev-parse HEAD
git rev-parse origin/master
rg -n "builder|knowledge|codeInsight|reports|dashboard.read|permission" app
docker compose --env-file .env.local ps
pnpm --filter @one-ops/portal-shell test --run
node --test gateway/*.test.mjs
pnpm --filter @one-ops/portal-shell build
pnpm test
pnpm build
docker compose --env-file .env.local ps
curl.exe -k -sS -i --max-time 15 https://192.168.20.54/api/work-center/v1/health
docker compose --env-file .env.local exec -T postgres psql -U onehr_ops -d onehr_operations -Atc "SELECT p.code || '|' || p.action || '|' || count(rp.role_id) FROM permissions p LEFT JOIN role_permissions rp ON rp.permission_id = p.id WHERE p.code IN ('builder.use','knowledge.use','code.insight.use','reports.read') GROUP BY p.code,p.action ORDER BY p.code;"
Browser: http://127.0.0.1:5187/system-management/roles の DOM、metrics、Console、Screenshot を確認
```

データベース確認では `036_add_portal_navigation_permissions.sql` を実行し、四つの Permission Code と `SYSTEM_ADMIN`、`OPERATOR`、`VIEWER` の関連を読み取る。認証情報と秘密値は出力しない。
