# 証跡索引

| 証跡 | パス | 用途 |
| --- | --- | --- |
| 要件 | `docs/INQUIRY_SUPPORT_REQUIREMENTS.md` | 表示対象、直接ダウンロード、セキュリティ境界 |
| 表示実装 | `app/apps/portal-shell/src/InquirySupportPage.tsx` | 上位ドロワー、画像、文書表示、ダウンロード |
| 表示判定 | `app/apps/portal-shell/src/inquiry-support-utils.ts` | 拡張子別表示方式 |
| API 契約 | `app/packages/api-client/src/index.ts` | プレビューとダウンロード URL |
| Gateway | `app/gateway/inquiry-support-routes.mjs` | Content-Type、Content-Disposition、Range 応答 |
| 実サイト接続 | `app/gateway/inquiry-support-source.mjs` | S3 許可リダイレクトと Cookie 分離 |
| Gateway テスト | `app/gateway/inquiry-support.test.mjs` | 表示対象、ヘッダー、Range、リダイレクト |
| Portal テスト | `app/apps/portal-shell/src/inquiry-support.test.ts` | ドロワー、直接ダウンロード、解析 UI 不在 |
| 画面検証 | `docs/investigations/inquiry-attachment-preview-20260727/test_results.md` | 公開画面の上位ドロワー、操作、コンソール結果 |
