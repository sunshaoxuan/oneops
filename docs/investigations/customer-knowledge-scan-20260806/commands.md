# 実行記録

資格情報及び Knowledge 本文全体は記録しない。

1. CAG `/health/live`、`/health/ready`、`/api/v1/projects` を確認した。
2. `/api/v1/knowledge/search` へ Code、正式名、契約及びネットワーク条件を送信した。
3. `/api/v1/tasks` へ `knowledge_mode=required`、`learning_mode=off` の読取専用 Task を作成した。
4. Gateway Supervisor Log で Ready 失敗と再起動時刻を確認した。
