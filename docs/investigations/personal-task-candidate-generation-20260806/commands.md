# 実行記録

1. `node --test gateway/personal-task.test.mjs gateway/inquiry-support.test.mjs`
2. `pnpm --filter @one-ops/portal-shell test -- personal-tasks.test.ts`
3. `pnpm --filter @one-ops/portal-shell build`
4. PostgreSQL Transaction 内で Migration 033 を実行し、Constraint と Revision を確認後に Rollback
5. `git diff --check`
