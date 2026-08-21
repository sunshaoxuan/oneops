# 最終受入チェックリスト

| 原要求 | 成果物 | 確認方法 | 状態 |
| --- | --- | --- | --- |
| 過去メッセージのコピーと編集 Icon | `AiAssistantChat.tsx`、`ai-assistant.css` | Portal Test、Browser Hover | 確認済み |
| 改行を持つコピー | Clipboard Helper | Unit Test、Browser Clipboard | 確認済み |
| 取消で送信しない | Inline Editor | Browser 表示と可視メッセージ維持 | 確認済み |
| 確認で同位置へ置換再送信 | Route と Ledger | Gateway Test、Browser Task Ledger | 確認済み |
| 元の問合せ参照、添付、Session Snapshot を維持 | Route と Attachment Store | Gateway Test、Task Ledger | 確認済み |
| 切断分岐を Model History から除外 | Database Repository | Gateway Test | 確認済み |
| 要件記録 | `AI_ASSISTANT_REQUIREMENTS.md` 第 89 項 | 文書確認 | 確認済み |
| 自動テストと Build | `pnpm --dir app check` | 実行結果 | 確認済み |
