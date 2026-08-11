# 証拠索引

| 主張 | 証拠 | 確信度 | 制約又は補足 |
|---|---|---|---|
| Portal の旧 Lock は HTTP 要求期間だけだった | 修正前 `AiAssistantChat.tsx` の `sendMutation.isPending` 条件と旧 Test | 高 | 原因調査時の Source 証拠 |
| 最新未完了 Task だけへの SSE 切替が回答混在を生んだ | 修正前 `liveTaskId` の逆順選択と EventSource Effect | 高 | 原因調査時の Source 証拠 |
| Portal の全送信入口が共通 Lock を使用する | `app/apps/portal-shell/src/AiAssistantChat.tsx:1411`、`:1548`、`:2102`、Portal 23 件の集中試験 | 高 | Mouse、Keyboard、添付、Paste、Drag and Drop を含む |
| Task 終端後に Cache を先に更新して Composer を復元する | `app/apps/portal-shell/src/AiAssistantChat.tsx:1176` と `app/apps/portal-shell/src/ai-assistant.test.ts:289` | 高 | Server 再取得を続けて状態を確定する |
| Gateway が同じ Conversation の並行要求を原子的に遮断する | `app/gateway/ai-assistant-database.mjs:85` の Transaction、`:101` の `FOR UPDATE NOWAIT`、`ai-assistant-routes.mjs:402` | 高 | 未完了又は未知 Task 状態は HTTP 409 |
| 同時要求では CAG Task が 1 件だけ作成される | Gateway、Database、個人タスクの集中試験 39 件 | 高 | Multi Tab と複数 Gateway Process の Frontend 迂回を対象にする |
| 個人タスク AI も同じ Lock を使用する | `app/gateway/personal-task-ai.mjs` と `app/gateway/personal-task.test.mjs` | 高 | Portal と同時作成する試験を含む |
| 完了、取消し、失敗は独立した終端 Event である | OpenAI 公式 Webhook Event 文書 | 高 | ChatGPT Composer の固定 UI 契約としては使用しない |
| 回答実行中は新しい送信を作成できない | 正式 Browser DOM、`single-flight-locked-0.18.16.png`、SHA256 `6EE036111F86B88156DC0B485BE7C80D5E79D4430903E3ABEB5E372A8816D9CB` | 高 | TextArea、送信、添付、File Input 無効、`aria-busy="true"`、User Message 4 件 |
| 別 Conversation は独立して利用できる | 正式 Browser で別 Conversation は入力可能、実行元へ戻すと Lock 継続 | 高 | 隔離単位は現在の Conversation |
| 既存 Task は取消されず終端まで継続する | 正式 Browser で 54 秒後に五項目の回答を表示 | 高 | 実行中 Task と SSE を保持した実行証拠 |
| 終端後に Composer が復元する | 正式 Browser DOM、`single-flight-terminal-0.18.16.png`、SHA256 `24B77C47AA066ACBBA224951D901DC0CEFAA3B64B37299D4A8D0882E068791D6` | 高 | TextArea、添付、File Input 有効、`aria-busy="false"`、案内 0 件 |
| Console Error と Warning がない | 正式 Browser Console の Error、Warn、Warning 取得結果 `[]` | 高 | 200 件を上限として取得 |
| 正式 Runtime が実装 Commit を配信した | SYSTEM Continuous Delivery `delivery_succeeded`、Health `UP`、Version `0.18.16` | 高 | 2026年8月11日 16時22分47秒に成功 |
| Build、配信 Directory、HTTPS 応答が一致する | `index.html`、JS、CSS の三層 SHA256 一致 | 高 | JS `6994ECB9E532170DB27328B00E121BC375973BD7D2BCACA8EA91A0984177EB3D`、CSS `D81657324CC09691DA7ABD30624D3A8202B26CB2C8815B955E36D262652F18CB` |
| 正式 Git が一つの対象を指す | `HEAD == origin/master == v0.18.16^{}` | 高 | Tag 作成後の最終 Remote Equality で確認 |
