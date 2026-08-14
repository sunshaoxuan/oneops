# 証拠索引

| ID | 主張 | 証拠 | 状態 |
|---|---|---|---|
| E01 | Semantic Intent と確定 Routing は Japanese を選択済みだった | 正式 DB の障害 Task と再実行 Task、`investigation_report.md` | 合格 |
| E02 | 最終生成へ直前 Turn が混在した | `references_previous_context=true`、`context_scope=latest_turn` の正式 DB 記録 | 合格 |
| E03 | 日中相互翻訳は現在入力だけを最終生成へ渡す | `app/gateway/ai-assistant-openai.mjs` と同 Test | 合格 |
| E04 | Shortcut Code を実行 Context へ渡す | `app/gateway/ai-assistant-database.mjs` と同 Test | 合格 |
| E05 | Semantic Routing は本 Turn の Japanese を採用する | `app/gateway/ai-assistant-routing.mjs` と同 Test | 合格 |
| E06 | 全量 Application Check | Gateway 320、Worker 18、Portal 273、Production Build | 合格 |
| E07 | Spring Backend | 49 件、Failure 0、Error 0、環境条件 Skip 10 | 合格 |
| E08 | SYSTEM 正式配信 | `continuous-delivery.log` 2026-08-14 16:48:57、Version 0.18.23、8092 Health UP | 合格 |
| E09 | Browser の三方向切替、Console、Screenshot | `test_results.md`、`docs/evidence/ai-assistant-bidirectional-translation-0.18.23-20260814.png` | 合格 |
