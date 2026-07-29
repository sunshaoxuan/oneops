# 証跡一覧

| 主張 | 証跡 | 確度 | 制限 |
| --- | --- | --- | --- |
| CAG Conversation ID は物理 ID | `backend/app/models/conversation.py` | 高 | CAG は参照のみ |
| Conversation 作成は `id` を返す | `backend/app/api/conversations.py` | 高 | CAG は参照のみ |
| Task は `conversation_id` を受け取る | `backend/app/api/tasks.py` | 高 | CAG は参照のみ |
| Conversation SSE は独立 sequence を持つ | `backend/app/services/task_service.py`、`backend/app/api/conversations.py` | 高 | CAG は参照のみ |
| OneOps は同じ ID を主キーにする | `app/db/migrations/019_create_ai_assistant_sessions.sql` | 高 | OneOps 実装 |
| 所有者確認後だけ CAG を呼ぶ | `app/gateway/ai-assistant-routes.mjs` | 高 | OneOps 実装 |
| ブラウザーは CAG Secret を保持しない | `app/gateway/ai-assistant-routes.mjs` | 高 | OneOps 同一生成元 Proxy |
| 会話入口は権限で表示する | `App.tsx`、`auth.mjs` | 高 | `ai.assistant.use` |
| CAG プロセスを変更していない | 公開前後の OpenAPI 版とポート PID | 高 | GET と OS 読取結果 |
| 閉じる途中の読込失敗は問い合わせ ID の早期破棄が原因 | `InquirySupportPage.tsx` の `closeTicket` と Drawer 描画条件 | 高 | 旧実装の状態遷移 |
| 問合せ参照履歴は Task Prompt から復元する | `ai-assistant-routes.mjs`、`AiAssistantChat.tsx` | 高 | CAG Task が正式データソース |
| 未送信参照は保持せず、送信済み参照だけを灰色表示する | `assistantInquiryReferences` と `ai-assistant.test.ts` | 高 | Session 単位 |
| 入力不可の原因は Drawer の既定焦点ロック | Ant Design 6.5.1 `drawer/useFocusable.js`、Task 状態の読取結果 | 高 | 活動中 Task は 0 件 |
