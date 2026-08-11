# 試験結果

更新日: 2026-08-11

| 対象 | 結果 | 証拠 |
| --- | --- | --- |
| Portal 全試験 初回 | 1 件失敗 | Popconfirm 削除に伴う Overlay 数の旧断言を検出 |
| Portal 全試験 返工後 | 合格、32 File、203 件 | Vitest |
| Database 削除可能性 | 合格 | Transaction 内 DELETE 1 行、Rollback 後保持 |
| Gateway 全試験 | 合格、261 件 | Node Test |
| Worker 試験 | 合格、14 件 | Python unittest |
| Portal 全試験 | 合格、32 File、203 件 | Vitest |
| TypeScript と Vite Production Build | 合格 | `pnpm check` |
| Spring Backend | 合格、40 件中 32 件合格、8 件環境条件 Skip | Maven Test、BUILD SUCCESS |
| 正式配信 | 合格 | SYSTEM Continuous Delivery、2026-08-11 08:53:45 |
| 正式 Health | 合格 | HTTP 200、`UP`、version 0.18.8、`legacyGatewayReady=true` |
| 中央削除 Modal | 合格 | 対象会話名、閉じる、危険操作の削除 Button |
| 既存履歴の削除 | 合格 | Browser 約 410 ms、Server HTTP 200 及び 23 ms |
| Refresh 後の非復元 | 合格 | 削除 Button 0 件、PostgreSQL 対象 Session 0 件 |
| Browser Console | 合格 | Warning 0、Error 0 |
| Screenshot | 合格 | 個人情報を除外した 2 件 |
