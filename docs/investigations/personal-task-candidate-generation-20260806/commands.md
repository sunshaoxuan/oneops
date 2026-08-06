# 実行記録

1. `node --test gateway/personal-task.test.mjs gateway/inquiry-support.test.mjs`
2. `pnpm --filter @one-ops/portal-shell test -- personal-tasks.test.ts`
3. `pnpm --filter @one-ops/portal-shell build`
4. PostgreSQL Transaction 内で Migration 033 を実行し、Constraint と Revision を確認後に Rollback
5. `git diff --check`
6. `docker exec onehr-operations-postgres psql ...` により External Account、最新 Sync Run、Candidate Disposition を確認
7. 実画面 `/tasks` から問合せ接続の `候補を再生成` を実行
8. In-app Browser で Desktop 1265px と Narrow 390px を確認し、`tab.dev.logs` で Console を確認
9. `nginx.exe -t`、HTTPS `/tasks`、HTTPS Health、8092、8093 の待受を確認
10. `pnpm --filter @one-ops/portal-shell test` と `pnpm --filter @one-ops/portal-shell build` を狭幅修正ごとに再実行
11. `git fetch origin master`、対象 File の Commit、`git push origin master`、Local HEAD と `origin/master` の一致を確認
