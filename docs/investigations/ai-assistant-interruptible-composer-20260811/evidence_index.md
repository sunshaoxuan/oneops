# 証拠索引

| 証拠 | 状態 | 内容 |
| --- | --- | --- |
| `investigation_report.md` | 更新済み | 調査、契約、実装境界及び既知の永続化境界 |
| `commands.md` | 更新中 | 実行命令と結果 |
| `test_results.md` | 更新中 | CAG と OneOps の試験、Build、Runtime 結果 |
| `FINAL_ACCEPTANCE_CHECKLIST.md` | 更新中 | 当初目的に対する逐項受入 |
| `FINAL_RECEIPT.md` | 更新中 | Release と引渡しの最終状態 |
| CAG Commit `8880e0522e8e18fe0c034ae6426618d7a380ded2` | 合格 | `origin/master` と `v0.28.4^{}` が一致 |
| CAG Runtime 8000、8001、8002 | 合格 | Version `0.28.4`、Readiness `ready`、Cancel Route 202 Schema |
| CAG Task `208e3b78-be7f-4eda-88a6-56b18a1d59fe` | 合格 | Leased Cancel、最終 Cancelled、単一 `task.cancelled` |
| OneOps 全試験 | 合格 | Gateway 279 件、Worker 14 件、Portal 213 件、Spring 40 件中 8 件 Skip |
| OneOps Production Build | 合格 | TypeScript、Vite、`index-Bvl4Go5a.js`、`index-BQkCaVWd.css` |
| OneOps Operations Script | 合格 | 9 Script、Delivery、Rolling Switch、Recovery、Readiness |
| OneOps 正式 Runtime と Browser | 待検証 | 配信後に DOM、Network、Console、Screenshot を記録 |
