# AIアシスタント経過時間表示調査

## 結論

タスク作成後に回答本文が空の期間でも、タスクの作成時刻を起点とする経過時間と処理トレースを直ちに表示するよう修正した。毎秒更新は既存の `ConversationStatusActivity` と `AssistantProcessTrace` のタイマーを使用する。

## 確認事実

| 主張 | 証拠 | 確度 | 制限 |
|---|---|---|---|
| タスク作成時刻は API の `created_at` として返される | `app/gateway/ai-assistant-routes.mjs` の `publicAiAssistantTask` | 高 | 実ブラウザー操作は配信後確認が必要 |
| 待機計時は `startedAt` から毎秒再計算される | `app/apps/portal-shell/src/GenerativeConversationLoader.tsx` | 高 | なし |
| 回答本文が空の間、処理トレースが表示されない条件があった | `AiAssistantChat.tsx` の旧レンダー条件 | 高 | なし |
| 回答受信前にも処理トレースを表示する | 同ファイルの新条件と単体テスト | 高 | ブラウザー証跡は配信後取得 |

