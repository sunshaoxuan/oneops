# 証拠索引

| 主張 | 証拠 | 確信度 | 制約 |
|---|---|---|---|
| 候補通知は内部候補、外部 System、外部 Object を物理 ID で記録する | `app/db/migrations/055_link_notifications_to_external_sources.sql`、実 Database `user_notifications` 定義 | 高 | なし |
| 既存候補通知は具体的な候補 URL へ更新された | 実 Database 集計 `1|1|1|1` | 高 | 認証済み Browser の選択操作は未確認 |
| API は発生元及び重要 ID を返す | `app/gateway/personal-task-database.mjs`、Gateway 317 Test | 高 | 認証済み実 API 応答は未取得 |
| 候補 URL は対象候補 Drawer を自動表示する | `app/apps/portal-shell/src/PersonalTasksPage.tsx`、Portal 273 Test | 高 | 実 Browser DOM は `evidence_missing` |
| 通知ベルは主色背景と重なり Badge を使用する | `app/apps/portal-shell/src/styles.css`、Production Build | 中 | 実 Browser Screenshot は `evidence_missing` |
| 正式 Runtime と配信物は稼働している | `delivery_succeeded`、8092 Health、`nginx -t`、HTTPS 200、Asset Hash 一致 | 高 | 認証後 UI の確認を含まない |
