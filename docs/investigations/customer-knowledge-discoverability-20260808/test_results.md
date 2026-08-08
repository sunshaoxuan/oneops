# テスト結果

更新日: 2026-08-08

| 検証 | 結果 | 証拠 |
| --- | --- | --- |
| Portal Vitest | 合格、22 ファイル、173 件 | `pnpm --filter @one-ops/portal-shell test` |
| Gateway テスト | 合格、218 件 | `pnpm check` |
| Worker テスト | 合格、14 件 | `pnpm check` |
| Portal 本番ビルド | 合格 | `pnpm check` |
| 権限マトリクスの旧権限除外 | 合格 | `permission-matrix.test.ts` |
| 公開 | 合格 | `delivery_succeeded`、`-SkipGatewayRestart`、HTTPS 200、Gateway health `UP` |
| 公開 JavaScript の内容 | 合格 | 新メニュー、CAG 入口、`initialOrganizationId` を確認 |
| 認証後 Browser 入口 | `evidence_missing` | 認証状態に依存 |
| Browser Console | `evidence_missing` | 認証済み画面に未到達 |
| Browser スクリーンショット | `evidence_missing` | 認証済み画面に未到達 |
