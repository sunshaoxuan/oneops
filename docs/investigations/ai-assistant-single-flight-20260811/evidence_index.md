# 証拠索引

| 主張 | 証拠 | 状態 |
|---|---|---|
| Portal の旧 Lock は HTTP 要求期間だけだった | `AiAssistantChat.tsx` の旧 `sendMutation.isPending` 条件 | 確認済み |
| 最新未完了 Task だけへの SSE 切替が回答混在を生んだ | `liveTaskId` の逆順選択と EventSource Effect | 確認済み |
| Gateway の旧 Task 一覧取得は Routing 専用だった | `ai-assistant-routes.mjs` の Message Route | 確認済み |
| 個人タスク AI に共通 Lock 外の Task 作成経路があった | `personal-task-ai.mjs` の旧 `POST /tasks` と `touchTask` | 確認済み |
| 完了、取消し、失敗は独立した終端 Event である | OpenAI 公式 Webhook Event 文書 | 確認済み |
| Portal の全送信入口が共通 Lock を使用する | Source Test と Browser DOM | Source 合格、Browser 待検証 |
| 同じ Conversation の並行要求は 1 件だけ CAG へ到達する | Gateway と Database Test | 合格 |
| Task 終端後に Composer が復元する | Portal Test と正式 Browser | Test 合格、Browser 待検証 |
| 別 Conversation は独立して利用できる | Portal Test と正式 Browser | Test 合格、Browser 待検証 |
| 正式 Runtime が対象 Commit と一致する | Health、Asset Hash、Git Object ID | 待検証 |
| Console Error と Warning がない | 正式 Browser Console | 待検証 |
| 実行中と終端後の画面状態 | 正式 Screenshot | 待検証 |
