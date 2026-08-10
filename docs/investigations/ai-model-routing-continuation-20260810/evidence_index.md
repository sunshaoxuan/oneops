# 証拠索引

| 主張 | 証拠 | 確度 | 制約 |
|---|---|---|---|
| AI助手が `SIMPLE` と `GENERAL` を Task ごとに選択する | `app/gateway/ai-assistant-routing.mjs`、Gateway Test | 高 | 実 Model 応答は Runtime 検証対象 |
| 会話内 Task Summary を後続入力へ継続する | `ai-assistant-routing.test.mjs` の本文継続と明示継続 Test | 高 | 決定的分類器の対象語彙に依存 |
| 同一 Task の再実行は一度だけ昇格する | Fingerprint Test | 高 | 品質 Validator による昇格は未追加 |
| 工単相当の問合せ全体分析は初回から `GENERAL` | Inquiry Context Routing Test | 高 | 問合せ支援内 AI 補助は従来どおり `INQUIRY` |
| CAG は Model と Effort を app-server へ渡す | `test_codex_app_server_runtime.py` の Protocol Fixture | 高 | Local Codex 実行は配信後検証対象 |
| CAG は Routing Context を監査保存する | `test_tasks_api.py` と Audit API | 高 | Token Usage は Runtime 提供時だけ取得可能 |
| app-server が Task ごとの Model と Effort を許可する | OpenAI 公式 Codex App Server Documentation | 高 | 導入 Version の Catalog 利用可否は `model/list` が正 |
