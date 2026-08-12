# 証拠索引

| 主張 | 証拠 | 信頼度 | 制限 |
|---|---|---|---|
| DB 会話は所有者を保持する | `019_create_ai_assistant_sessions.sql` | 高 | なし |
| Server 読み書きは所有者条件を使用する | `ai-assistant-database.mjs`、`ai-assistant-routes.mjs` | 高 | なし |
| Client 詳細 Cache に利用者 ID が不足していた | `AiAssistantChat.tsx` 修正前 Query Key | 高 | なし |
| 参照重複排除が質問単位だった | `inquiryContextKey` 修正前実装 | 高 | なし |
| 票単位検索を DB Index が支援する | Migration 047 | 高 | 正式 Migration は配信後確認予定 |
