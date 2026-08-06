# 证据索引

| ID | 证据 | 结果 |
| --- | --- | --- |
| O1 | OneOps 全量测试 | 200 Node，14 Python Worker，154 Vitest 全部合格 |
| O2 | Production Build | Vite 与 TypeScript Build 合格，有既有 Chunk Size Warning |
| O3 | Migration 全量重放 | 001 到 034 的现存 SQL 全部合格 |
| O4 | 正式用途设置 | `bbcd67c1-b982-4970-874f-0d3a6d71eec8` |
| O5 | 正式组织 Subject | 组织主键 2，Subject UUID `7ebe3b5d-015a-4718-9931-64994017338e` |
| O6 | 正式 Scan | `e109f2ae-a3a2-4023-bb40-3fad9a95a45e` |
| O7 | Coverage 与终态 | 296 total，37 analyzed，70 failed，189 excluded |
| O8 | 系统管理知识源设置 | `customer-knowledge-source-settings.png` |
| O9 | 筑波大学 UI | `tsukuba-scan-overview.png`、`tsukuba-candidate-evidence-conflict.png`、`tsukuba-candidate-applied-success.png` |
| O10 | Candidate Apply | Candidate `f6e0805d...` 为 `APPLIED`，Applied Record 为组织机构物理记录 `2` |
| O11 | Apply 审计 | Event `b7531332...`，Actor `143a55ae...`，HTTP 200，SUCCESS |
| O12 | Console | OneOps 应用 Warning 和 Error 为 0，浏览器扩展噪声 6 条 |
