# 試験結果

| 対象 | 結果 | 証拠 |
|---|---|---|
| OneOps Routing と AI助手定向 Test | 合格 | 12 passed |
| OneOps Gateway 全 Test | 合格 | 223 passed |
| CAG Model Routing 定向 Test | 合格 | 27 passed |
| CAG 全 Test の機能結果 | 合格 | 170 passed、3 skipped、0 failed |
| CAG 全体 Coverage | 未合格 | 82.85%、基準 85% |
| OneOps Build | 未実施 | 後続検証 |
| CAG 隔離 Full Suite | 合格 | 165 passed、3 skipped、Coverage 85.46% |
| Installed app-server Schema | 合格 | Codex CLI 0.147.0-alpha.6.5、Thread Model と Turn Model、Effort を確認 |
| Model Catalog | 合格 | luna は low、terra は medium を提供 |
| Real luna Turn | 合格 | completed、low、1698 ms |
| Real terra Turn | 合格 | completed、medium、2350 ms |
| 正式 Runtime API | 未合格 | Port 8000 OpenAPI は旧 Task Schema を配信中 |
| Browser、Console、Screenshot | 未実施 | 配信後検証 |

CAG Coverage の低下は並行作業中の Knowledge Connector と Extraction の未 Commit 変更を含む全体計測で発生した。本 Task の正式 Commit `ba4d2fa` を隔離した Clone では 165 passed、3 skipped、Coverage 85.46% となり Gate に合格した。
