# 証拠索引

| Claim | Evidence | Confidence | Limitation |
|---|---|---|---|
| 旧実装は「解析」を複雑分析へ分類した | 修正前 `app/gateway/ai-assistant-routing.mjs` の正規表現、利用者 Screenshot | high | なし |
| Portal は `COMPLEX_ANALYSIS` で三段階 Process を表示する | `app/apps/portal-shell/src/AiAssistantChat.tsx` | high | なし |
| Semantic Intent が最終 Routing を確定する | `app/gateway/ai-assistant-openai.mjs`、Routing Test、正式 Task Ledger | high | なし |
| Intent と Routing は同一 Transaction で保存される | `app/gateway/ai-assistant-database.mjs`、Database Test | high | なし |
| 待機中 Portal は Routing Event を反映する | `AiAssistantChat.tsx`、Interaction Test、正式 Browser | high | なし |
| 実例の第三句は翻訳を継続する | `app/gateway/ai-assistant-routing.test.mjs`、正式 Task Ledger、最終 Screenshot | high | なし |
| 正式環境は 0.18.21 を配信済み | Continuous Delivery Log、HTTPS Health | high | なし |
