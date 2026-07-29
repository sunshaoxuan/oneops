# 証拠索引

| 主張 | 証拠 | 確度 | 制限 |
|---|---|---|---|
| ブラウザーの HTTP と SSE は同じ OneOps API 基点を使用する | `app/packages/api-client/src/index.ts` の `aiAssistantSessionPath`、`sendAiAssistantMessage`、`subscribeAiAssistantEvents` | 高 | なし |
| OneOps の JSON と SSE は同じ Agent Gateway Endpoint を使用する | `app/gateway/ai-assistant-routes.mjs` の `jsonRequest`、`pipeConversationEvents` | 高 | 保存済み Endpoint の値は画面設定に依存する |
| 稼働中 CAG は 8000 で HTTP と SSE を公開する | `http://127.0.0.1:8000/openapi.json`、`Get-NetTCPConnection -LocalPort 8000` | 高 | 稼働版は 0.12.0 |
| 画面停止の原因は全 Task を集約した `busy` | 修正前 `app/apps/portal-shell/src/AiAssistantChat.tsx` | 高 | なし |
| 現行 CAG は同一 Conversation の並行 Task を 409 で拒否する | `D:\workspace\cag\backend\app\services\task_service.py`、`backend\app\api\tasks.py` | 高 | CAG は変更対象外 |
| 修正後は実行中 Task が入力欄を無効化しない | `app/apps/portal-shell/src/AiAssistantChat.tsx`、`src/ai-assistant.test.ts`、認証後ブラウザー確認 | 高 | 実 CAG Task の新規作成は未実施 |
