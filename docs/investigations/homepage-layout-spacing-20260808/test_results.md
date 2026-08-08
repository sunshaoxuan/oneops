# テスト結果

更新日: 2026-08-08

## 結果一覧

| 検証 | 結果 | 証拠 |
| --- | --- | --- |
| Portal Vitest | 合格、22 ファイル、171 件 | `pnpm --filter @one-ops/portal-shell test` |
| Gateway テスト | 合格、218 件 | `pnpm check` |
| Worker テスト | 合格、14 件 | `pnpm check` |
| Portal ビルド | 合格 | `pnpm check` |
| 公開 | 合格 | `delivery_succeeded`、Gateway health `UP`、HTTPS 200 |
| 公開 CSS の内容 | 合格 | `/assets/index-cx8Vq2Yu.css` に `.workbench-personal-task-summary{margin-top:18px}` を確認 |
| Browser Workbench 表示 | `evidence_missing` | SSO 認証待ち画面から進めなかった |
| Browser Console | `evidence_missing` | Workbench まで到達できなかった |
| Browser スクリーンショット | `evidence_missing` | 認証済みホーム画面を取得できなかった |

## 新規テスト

`app/apps/portal-shell/src/workbench-spacing.test.ts` は次の内容を検証する。

1. `.workbench-personal-task-summary` の `margin-top` が `18px` であること。
2. Workbench に `hero-panel` と `personal-task-summary workbench-personal-task-summary` が存在すること。
