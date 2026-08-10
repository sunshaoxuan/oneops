# 証拠索引

| 主張 | 証拠 | 確度 | 制約 |
|---|---|---|---|
| AI助手は SIMPLE と GENERAL を Task 分類及び再実行で切り替える | `app/gateway/ai-assistant-routing.mjs` | 高 | 詳細な保存経路を継続調査中 |
| 問合支援は INQUIRY 専用 Model 契約を持つ | `docs/EXTERNAL_TASK_SETTINGS_REQUIREMENTS.md`、`docs/INQUIRY_SUPPORT_REQUIREMENTS.md` | 高 | 実装経路を継続調査中 |
| 現行 Model 用途は一用途一行である | `app/db/migrations/015_expand_ai_settings.sql` | 高 | 最新 Migration 適用後のスキーマを継続確認中 |
| Agent Gateway 接続確認は実測 latencyMs を返す | `app/gateway/agent-gateway-settings.mjs` | 高 | Model API の速度属性とは別契約 |
| 成熟製品は推理強度と速度を別の選択軸として表示する | OpenAI ChatGPT Release Notes | 高 | 製品 UI の契約であり OneOps の実測値ではない |
| Model 性能は品質、Latency、Throughput を別指標で比較する | Microsoft Foundry Model Benchmarks | 高 | 公開 Benchmark と OneOps 実環境の性能は一致しない |
| Session 開始 Model を固定し後続 Task へ渡す | `app/gateway/ai-assistant-routes.mjs`、`app/gateway/ai-assistant-routing.mjs` | 高 | Runtime 検証中 |
| クイックアシスタントは開始 Model 物理 ID を外部キーで保持する | `app/db/migrations/039_expand_general_models_and_shortcut_starting_model.sql` | 高 | Migration 実行検証中 |
