# 証跡索引

| 主張 | 証跡 | 確度 | 制約 |
| --- | --- | --- | --- |
| 保存値はプロジェクト Key だった | 実 Database の `filter_json` は `projectIds=["TS2_ITS"]` | 高 | API Key は出力していない |
| 同期失敗は HTTP 400 だった | 実 Database の同期 Run と接続状態 | 高 | 旧 500 応答の本文は既存実装が保存していない |
| 認証と基本接続は正常だった | 実 Backlog API の本人、プロジェクト、担当課題の最小化確認は HTTP 200 | 高 | 読取専用リクエスト |
| `projectId[]` は Number 契約である | Backlog Developer API `Get Issue List` | 高 | 2026 年 8 月 12 日確認 |
| 自由入力が Key を許容した | `PersonalTasksPage.tsx` の旧 `projectIdsText` | 高 | ソース確認 |
| Gateway が値の型を検証していなかった | `normalizeExternalAccountInput` の旧実装 | 高 | ソース確認 |
