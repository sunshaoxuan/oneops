# 証拠索引

| 確認事項 | 証拠 | 状態 |
|---|---|---|
| 原因となる入力正規化順序 | `app/gateway/model-settings.mjs` | 確認済み |
| 画面が問合せ既定状態を編集項目にしない | `app/apps/portal-shell/src/ModelDesignPage.tsx` | 確認済み |
| 欠落 Payload の回帰防止 | `app/gateway/model-settings.test.mjs` | 合格 |
| 関連要件 | `docs/AI_SETTINGS_REQUIREMENTS.md` | 更新済み |
| 変更履歴 | `CHANGELOG.md` | 更新済み |
| Runtime 配信 | `app/logs/continuous-delivery.log`、8092・8093 Health | 合格 |
| 保存、Console、Screenshot | 認証済み Browser 実行証拠 | 証拠不足 |
| 意図分析の Structured Outputs 契約 | `app/gateway/ai-assistant-openai.mjs`、`app/gateway/ai-assistant-openai.test.mjs` | 合格 |
| 意図分析の Task Ledger 保存 | `app/gateway/ai-assistant-database.mjs`、Migration 045 | 実装及び全量試験合格、Database 実データ証拠不足 |
