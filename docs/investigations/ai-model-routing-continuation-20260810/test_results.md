# 試験結果

| 対象 | 結果 | 証拠 |
|---|---|---|
| OneOps Routing と AI助手定向 Test | 合格 | 12 passed |
| OneOps Gateway 全 Test | 合格 | 223 passed |
| CAG Model Routing 定向 Test | 合格 | 27 passed |
| CAG 全 Test の機能結果 | 合格 | 170 passed、3 skipped、0 failed |
| CAG 全体 Coverage | 未合格 | 82.85%、基準 85% |
| OneOps Build | 未実施 | 後続検証 |
| CAG 隔離 Full Suite | 未実施 | 正式 Commit 状態で後続検証 |
| Runtime API | 未実施 | 配信後検証 |
| Browser、Console、Screenshot | 未実施 | 配信後検証 |

CAG Coverage の低下は並行作業中の Knowledge Connector と Extraction の未 Commit 変更を含む全体計測で発生した。本 Task の `app/api/tasks.py` は 100%、`codex_app_server.py` は 87%、`tasks/executor.py` は 87% である。正式な合否は本 Task の Commit を隔離した状態で全 Suite を再実行して判定する。
