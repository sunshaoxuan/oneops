# 証拠索引

| Claim | Evidence | Confidence | Limitation |
|---|---|---|---|
| 旧実装は「解析」を複雑分析へ分類した | 修正前 `app/gateway/ai-assistant-routing.mjs` の正規表現、利用者 Screenshot | high | なし |
| Portal は `COMPLEX_ANALYSIS` で三段階 Process を表示する | `app/apps/portal-shell/src/AiAssistantChat.tsx` | high | なし |
| Semantic Intent が最終 Routing を確定する | `app/gateway/ai-assistant-openai.mjs`、Routing Test | high | 実 Provider 応答は Browser 最終受入で確認する |
| Intent と Routing は同一 Transaction で保存される | `app/gateway/ai-assistant-database.mjs`、Database Test | high | なし |
| 待機中 Portal は Routing Event を反映する | `AiAssistantChat.tsx`、Interaction Test | high | Browser 最終受入前 |
| 実例の第三句は翻訳を継続する | `app/gateway/ai-assistant-routing.test.mjs` | high | Model Semantic 判定は Browser 最終受入前 |
