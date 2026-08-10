# 試験結果

| 対象 | 結果 | 備考 |
| --- | --- | --- |
| OneOps Gateway 全量 | 240 passed | 最新 `origin/master` 同期後、失敗なし |
| OneOps Routing、Failover、Model 供給 | 31 passed | 失敗なし |
| OneOps Portal 全量 | 196 passed | 30 Test Files、失敗なし |
| OneOps Worker | 14 passed | Hyper-V 成功契約の環境条件を Test 内で固定 |
| OneOps Portal Build | passed | Vite Production Build |
| OneOps Spring Backend | 34 tests、8 skipped | Maven Build Success |
| CAG Backend 全量 | 176 passed、3 skipped | Coverage 85.11% |
| CAG Frontend | 17 passed | 失敗なし |
| CAG Frontend Build | passed | Vite Production Build |
| CAG Migration 往復 | passed | Migration 0026 を含む |

正式 Runtime と Browser の結果はリリース後に追記する。
