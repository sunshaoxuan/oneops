# 証跡索引

| 主張 | 証跡 | 信頼度 | 制限 |
|---|---|---|---|
| タスク画面の予定は当日終了後が期限の未完了期限タスクである | `app/apps/portal-shell/src/PersonalTasksPage.tsx` | 高 | 認証済み Browser は `evidence_missing` |
| 摘要 API が予定件数を返す | `app/gateway/personal-task-database.mjs`、Gateway 個人タスク試験 26 件、実 DB の期待値 1 と実値 1 の一致 | 高 | なし |
| 共有型が予定件数を要求する | `app/packages/api-client/src/index.ts`、TypeScript Build 検査 | 高 | なし |
| ホームが三言語対応の五カードを表示する | `app/apps/portal-shell/src/App.tsx`、Portal 273 件、Production Build | 中 | 認証済み Browser DOM は `evidence_missing` |
| 五列と既存 Responsive 規則を両立する | `app/apps/portal-shell/src/styles.css`、Portal 集中試験 | 中 | 実 Browser Screenshot は `evidence_missing` |
| 変更を正式 Runtime へ配信した | `app/logs/continuous-delivery.log` の 2026-08-14 14:53:29 成功記録 | 高 | 表示 Version は Unreleased のため 0.18.22 |
