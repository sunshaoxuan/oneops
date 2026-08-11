# 証拠索引

| 証拠 | 状態 | 内容 |
| --- | --- | --- |
| `investigation_report.md` | 更新済み | 調査、契約、実装境界及び既知の永続化境界 |
| `commands.md` | 更新中 | 実行命令、返工及び結果 |
| `test_results.md` | 更新中 | CAG、OneOps、返工後 Portal、Build、Runtime 結果 |
| `FINAL_ACCEPTANCE_CHECKLIST.md` | 更新中 | 当初目的に対する逐項受入 |
| `FINAL_RECEIPT.md` | 更新中 | Release と引渡しの最終状態 |
| CAG Commit `8880e0522e8e18fe0c034ae6426618d7a380ded2` | 合格 | `origin/master` と `v0.28.4^{}` が一致 |
| CAG Runtime 8000、8001、8002 | 合格 | Version `0.28.4`、Readiness `ready`、Cancel Route 202 Schema |
| CAG Task `208e3b78-be7f-4eda-88a6-56b18a1d59fe` | 合格 | Leased Cancel、最終 Cancelled、単一 `task.cancelled` |
| OneOps 最初の全試験 | 合格 | Gateway 279 件、Worker 14 件、Portal 213 件、Spring 40 件中 8 件 Skip |
| OneOps 終端競合返工 | 合格 | Session、Task、試行 ID の複合状態、背景 Stop SSE、終端 Reply 照合、Session 単位 Error |
| OneOps 返工後 Portal | 合格 | 定向 30 件、全 33 File 219 件、TypeScript、Vite |
| OneOps 返工後 Production Build | 合格 | `index-Ll7Ak_gu.js`、`index-BQkCaVWd.css` |
| OneOps 返工後全量 Check | 合格 | Gateway 279 件、Worker 14 件、Portal 219 件、TypeScript、Vite |
| OneOps Operations Script | 合格 | 9 Script、Delivery、Rolling Switch、Recovery、Readiness |
| OneOps 返工後 Spring Backend | 合格 | 40 件、8 件 Skip、Build Success |
| OneOps 最初の正式 Runtime | 合格 | SYSTEM 配信成功、Health 0.18.18、443、8092、8093、nginx 構文、三層 Asset Hash 一致 |
| OneOps 返工後正式配信 | 待検証 | 新 Application Tree の配信と Asset Hash を再確認する |
| OneOps Browser と Console | `evidence_missing` | 正式 URL のローカル Login 画面まで到達。認証済み Session 待ち |
