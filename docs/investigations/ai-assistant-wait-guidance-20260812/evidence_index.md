# 証拠索引

| 主張 | 証拠 | 確度 | 制約 |
| --- | --- | --- | --- |
| 対象 Task は単純な長時間生成ではなく Gateway Restart で失敗した | PostgreSQL Task Row と Event Ledger | 高 | Prompt は非表示 |
| 正常 Task は主に 4 秒から 22 秒で完了した | PostgreSQL 最近 Task | 高 | 現時点の局所実績 |
| 本文到着前の Loader に時間がなかった | 変更前 Source と利用者 Screenshot | 高 | なし |
| 30 秒から操作案内を表示する | Unit Test の 29 秒と 30 秒境界 | 高 | なし |
| 自動再試行を追加しない | Source と Interface 文書 | 高 | なし |
