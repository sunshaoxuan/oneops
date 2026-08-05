# 実行コマンド記録

更新日: 2026-08-05

## Repository 及び差分

```powershell
git fetch origin master
git status --short
git rev-parse HEAD
git rev-parse origin/master
```

## 自動試験

```powershell
cd D:\nginx\app
node --test gateway/organization.test.mjs gateway/customer-information.test.mjs gateway/auth.test.mjs
pnpm --filter @one-ops/portal-shell test
pnpm check
```

```powershell
cd D:\nginx\app\backend
.\mvnw.cmd -q test
```

## PostgreSQL 受入

```powershell
node --env-file=D:\nginx\app\.env.local D:\nginx\.codex-work\organization-context-code-sort-20260805\database-acceptance.mjs
```

Migration を二回適用し、一時組織機関を作成して外部 Code 対応、UUID 物理 ID、機関 Code の既定値適用を確認した。確認後に一時組織機関を削除した。
