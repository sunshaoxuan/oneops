# 証拠索引

| 確認事項 | 証拠 | 確度 | 制約 |
| --- | --- | --- | --- |
| 白画面発生時も環境 API は 200 | `logs/access.log` の 2026-08-03 20:51:34 | 高 | ブラウザー例外本文は取得できませんでした |
| Spring 応答に余分な包装が存在 | 修正前の `EnvironmentController.inventory` と失敗した実 PostgreSQL 試験 | 高 | なし |
| 従来 API は直下応答 | `app/gateway/server.mjs` の環境インベントリ経路 | 高 | なし |
| 修正後に閲覧者が参照可能 | `ImpersonationEnvironmentApiDatabaseTest` | 高 | 自動ロールバック試験 |
| 空データと不完全配列でも描画可能 | `EnvironmentPage.viewer.test.tsx` | 高 | jsdom 描画試験 |
