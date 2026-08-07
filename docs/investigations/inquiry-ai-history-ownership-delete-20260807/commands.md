# 実行コマンド記録

1. `git fetch origin`
2. `git status --short --branch`
3. 問合支援、AI 履歴、認証、権限、Migration、操作監査の `rg` 調査
4. `node --test gateway/inquiry-support.test.mjs gateway/operation-audit.test.mjs`
5. `pnpm --filter @one-ops/portal-shell test`
6. `pnpm --filter @one-ops/portal-shell build`
7. `git diff --check`

8. `mvnw.cmd test`
9. `publish-portal.ps1 -Reason inquiry-ai-history-ownership-delete-v0.15.7`
10. PostgreSQL で Migration 列、権限、ロール割当を確認
11. 受入専用履歴を作成し、公開 Browser で生成者、削除、管理者表示を確認
12. Browser Console の error と warning を確認
13. PostgreSQL で論理削除列、解析結果保持及び操作監査を確認
14. 受入専用履歴を物理削除し、残留件数 0 を確認
15. `nginx -t`、Health API、公開 Asset、Version を確認
