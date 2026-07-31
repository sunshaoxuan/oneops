# 証拠索引

| 証拠 | 内容 |
| --- | --- |
| `app/apps/portal-shell/src/InquirySupportPage.tsx` | 電球の位置分析、独立した問合せ全体分析領域、`FULL_TICKET` の 5 領域表示、履歴配置 |
| `app/apps/portal-shell/src/inquiry-support-utils.ts` | `TICKET` 履歴を問題ブロック非依存位置へ復元 |
| `app/gateway/inquiry-analysis.mjs` | `FULL_TICKET` の Prompt、待ち時間計算、公開回答判定、5 領域の応答検証 |
| `app/gateway/inquiry-support-routes.mjs` | `TICKET` アンカーの入力検証 |
| `app/db/migrations/021_expand_inquiry_assist_ticket_anchor.sql` | `assist_anchor` 制約の拡張 |
| `app/db/migrations/018_add_inquiry_assist_anchor.sql` | 全マイグレーション再実行時にも `TICKET` を許可する互換制約 |
| `app/gateway/inquiry-support.test.mjs` | アンカー、マイグレーション再実行互換、`FULL_TICKET` Prompt、5 領域、最終結論門限の単体テスト |
| `app/apps/portal-shell/src/inquiry-support.test.ts` | 履歴配置、独立 UI、整票分析表示の単体テスト |
| `test_results.md` | 完整テスト、公開、サービス検証結果 |
| `inquiry-ticket-level-ai-assist.png` | 公開画面のスクリーンショット |
