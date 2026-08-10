# 証拠索引

| 主張 | 証拠 | 確度 | 制約 |
|---|---|---|---|
| 旧 AI助手は SIMPLE と GENERAL を Task 分類及び再実行で切り替えていた | `app/db/migrations/039_expand_general_models_and_shortcut_starting_model.sql`、`app/gateway/ai-assistant-routing.test.mjs` | 高 | 現行契約では削除済み |
| 問合支援は INQUIRY 専用 Model 契約を持つ | `docs/EXTERNAL_TASK_SETTINGS_REQUIREMENTS.md`、`docs/INQUIRY_SUPPORT_REQUIREMENTS.md` | 高 | なし |
| GENERAL は安定物理 ID で複数管理できる | `app/db/migrations/039_expand_general_models_and_shortcut_starting_model.sql` | 高 | なし |
| Agent Gateway 接続確認は実測 latencyMs を返す | `app/gateway/agent-gateway-settings.mjs` | 高 | Model API の速度属性とは別契約 |
| 成熟製品は推理強度と速度を別の選択軸として表示する | OpenAI ChatGPT Release Notes | 高 | 製品 UI の契約であり OneOps の実測値ではない |
| Model 性能は品質、Latency、Throughput を別指標で比較する | Microsoft Foundry Model Benchmarks | 高 | 公開 Benchmark と OneOps 実環境の性能は一致しない |
| Session 開始 Model を固定し後続 Task へ渡す | `app/gateway/ai-assistant-routes.mjs`、`app/gateway/ai-assistant-routing.mjs`、Gateway 226 件 | 高 | なし |
| クイックアシスタントは開始 Model 物理 ID を外部キーで保持する | `app/db/migrations/039_expand_general_models_and_shortcut_starting_model.sql`、DB 件数照合 | 高 | 有効 12 件を確認 |
| クイックアシスタントは推理強度を独立保存する | `app/db/migrations/040_expand_shortcut_starting_model_options.sql`、`app/gateway/ai-assistant-shortcut-database.mjs` | 高 | 速度は Model 情報として参照 |
| 管理画面は Model と推理強度の階層設定メニューを提供する | `app/apps/portal-shell/src/AiAssistantShortcutSettingsPage.tsx`、Portal 回帰試験 | 高 | 修正後の実画面は evidence_missing |
| Model ID は Endpoint の一覧から選択する | `app/gateway/model-settings.mjs`、`app/apps/portal-shell/src/ModelDesignPage.tsx` | 高 | 保存時も再確認 |
| 正式 Runtime は 0.17.1 を配信する | Health `UP`、HTTPS 200、`continuous-delivery.log` | 高 | なし |
