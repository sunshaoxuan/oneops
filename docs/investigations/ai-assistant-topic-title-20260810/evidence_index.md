# 証拠索引

| 主張 | 証拠 | 確度 | 制約 |
|---|---|---|---|
| 旧実装は最初の文を 40 文字で切り出した | 修正前 `AiAssistantChat.tsx` | 高 | Screenshot と一致 |
| 翻訳方向をテーマ名へ変換する | `ai-assistant-title.test.ts` | 高 | 対応言語は初期 4 言語 |
| 長文本文を Session 名へ切り出さない | 一般相談 Test | 高 | 未分類入力は一般名 |
| 既存 AI助手機能を維持する | Portal Test 182 件 | 高 | Browser は配信後確認 |
