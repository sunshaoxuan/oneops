# テスト結果

| 検証 | 結果 | 証拠 |
| --- | --- | --- |
| Portal Shell 単体試験 | 成功、18 ファイル、160 件 | `pnpm test` |
| Gateway 単体試験 | 成功、207 件中失敗 0 | `pnpm test` |
| Migration 権限定義試験 | 成功、`第1階層機能の権限定義と既定ロール割当を登録する` | `gateway/portal-navigation-permissions.test.mjs` |
| Python Worker 単体試験 | 成功、14 件 | `pnpm test` |
| Production build | 成功、Vite 8.1.5 | `pnpm build` |
| 実 DB 権限一覧 | 四つの Code と三標準ロールへの初期割当を確認 | E-05 |
| 正式配信 Health | 成功、HTTP 200、`status=UP`、Spring Backend `0.15.0` | `https://192.168.20.54/api/work-center/v1/health` |
| Browser DOM、Console、Screenshot（ローカルフィクスチャ） | 成功、四つの新規ノードを含む権限マトリクス、横方向の溢出なし、warning/error 0 件、スクリーンショット保存済み | `docs/evidence/portal-navigation-permissions-20260807-fixture.png`、2026-08-07 Browser DOM/metrics/logs |
| Browser DOM、Console、Screenshot（正式 HTTPS） | `evidence_missing`、公開ページは Windows ドメイン認証待ちのままでロール画面へ到達できず、Console warning/error は 0 件 | `https://192.168.20.54/system-management/roles`、表示文言「Windows ドメイン認証を確認しています。」 |
