# 証跡一覧

| 証跡 | 内容 |
| --- | --- |
| `app/db/migrations/018_add_inquiry_assist_anchor.sql` | 位置種別の追加、既存データ移行、制約 |
| `app/gateway/inquiry-support-routes.mjs` | 位置種別と重点発言の整合性検証 |
| `app/gateway/inquiry-support-database.mjs` | 位置種別の保存と読み出し |
| `app/apps/portal-shell/src/inquiry-support-utils.ts` | 保存済み履歴から画面位置への解決 |
| `app/apps/portal-shell/src/InquirySupportPage.tsx` | 実行位置ごとの履歴表示 |
| `app/gateway/inquiry-support.test.mjs` | API 入力と旧クライアント互換の単体検証 |
| `app/apps/portal-shell/src/inquiry-support.test.ts` | 質問、発言、次の返信への復元検証 |
| `docs/evidence/inquiry-ai-history-anchor-20260728.png` | 公開後のブラウザー表示証跡 |
