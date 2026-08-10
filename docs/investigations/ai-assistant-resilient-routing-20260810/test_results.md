# 試験結果

| 対象 | 結果 | 備考 |
| --- | --- | --- |
| OneOps Gateway 全量 | 241 passed | 0.18.1、失敗なし |
| OneOps Routing、Failover、Model 供給 | 32 passed | 複数 terra の決定的供給を含む |
| OneOps Portal 全量 | 196 passed | 30 Test Files、失敗なし |
| OneOps Worker | 14 passed | Hyper-V 成功契約の環境条件を Test 内で固定 |
| OneOps Portal Build | passed | Vite Production Build |
| OneOps Spring Backend | 34 tests、8 skipped | Maven Build Success |
| CAG Backend 全量 | 176 passed、3 skipped | Coverage 85.11% |
| CAG Frontend | 17 passed | 失敗なし |
| CAG Frontend Build | passed | Vite Production Build |
| CAG Migration 往復 | passed | Migration 0026 を含む |
| CAG 主 Runtime | ready | OneOps 用 `0.0.0.0:8001`、0.28.1、PostgreSQL、Redis 共有 |
| CAG 予備 Runtime | ready | OneOps 用 `0.0.0.0:8002`、0.28.1、PostgreSQL、Redis 共有 |
| OneOps Network Failover | passed | 到達不能な主 Endpoint から実 `8002` API へ切替 |
| OneOps Runtime | passed | 0.18.1、Health `UP`、指紋化 Asset `index-Cf8EqAW7.js` |
| Browser | evidence_missing | Edge にログイン状態がなく、Windows SSO Navigation が Timeout |
| Console、Screenshot | evidence_missing | 認証後 AI 助手画面へ到達できず未取得 |

Runtime は合格した。認証後 Browser、Console 及び Screenshot が揃うまで正式リリース受入を完了しない。
