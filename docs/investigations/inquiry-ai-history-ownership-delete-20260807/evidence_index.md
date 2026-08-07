# 証拠索引

| ID | 主張 | 証拠 | 状態 |
|---|---|---|---|
| E01 | 生成者をユーザー物理 ID で保持する | `app/db/migrations/016_create_inquiry_support.sql`、`app/gateway/inquiry-support-routes.mjs` | 合格 |
| E02 | 生成者名と削除情報を API へ返す | `app/gateway/inquiry-support-database.mjs` | 合格 |
| E03 | 生成者本人だけが削除できる | `app/gateway/inquiry-support-routes.mjs`、Gateway 単体試験 | 合格 |
| E04 | 管理者だけが削除済み履歴を参照する | Migration 037、Gateway 単体試験 | 合格 |
| E05 | 削除済み履歴を省スペース表示する | `InquirySupportPage.tsx`、`styles.css`、Portal 単体試験 | 合格 |
| E06 | 実 DB の論理削除で生成者、削除者、解析結果を保持する | PostgreSQL 実行結果 | 合格 |
| E07 | 公開画面で生成者本人が削除できる | Browser DOM、`docs/evidence/inquiry-ai-history-deleted-admin-redacted-20260807.png` | 合格 |
| E08 | 管理者へ削除済み履歴を省スペース表示する | 裁切済み Browser Screenshot | 合格 |
| E09 | 公開 Runtime と Version が一致する | Health API `0.15.7`、Portal `v0.15.7` | 合格 |
| E10 | Browser Console に問題がない | error、warning 0 件 | 合格 |
