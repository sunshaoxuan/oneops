# 試験結果

| 項目 | 結果 | 証拠 |
| --- | --- | --- |
| CAG Task Cancel API | 合格 | `test_tasks_api.py` 19 件 |
| CAG Backend 全試験 | 合格 | 190 件成功、4 件 Skip、Coverage 85.27% |
| CAG Frontend | 合格 | 22 件成功 |
| CAG Production Build | 合格 | TypeScript、Vite |
| CAG Runtime | 合格 | 8000、8001、8002、Version 0.28.4、Ready |
| CAG 実 Task Cancel | 合格 | Leased から Cancelled、Cancelled Event 1、Completed 0、Failed 0 |
| OneOps Gateway、Database、Audit 重点試験 | 合格 | 36 件成功 |
| OneOps Portal 重点試験 | 合格 | 35 件成功 |
| OneOps Portal TypeScript | 合格 | `tsc -b` |
| OneOps Gateway 全試験 | 合格 | 279 件成功 |
| OneOps Worker 全試験 | 合格 | 14 件成功 |
| OneOps Portal 最初の全試験 | 合格 | 213 件成功 |
| OneOps 終端競合返工 定向試験 | 合格 | 1 File、30 件成功 |
| OneOps 終端競合返工 Portal 全試験 | 合格 | 33 File、219 件成功 |
| OneOps Operations Script | 合格 | 9 Script |
| OneOps Spring Backend | 合格 | 40 件、8 件 Skip、Build Success |
| OneOps 返工後 Production Build | 合格 | TypeScript、Vite、3850 Module、`index-Ll7Ak_gu.js`、`index-BQkCaVWd.css` |
| Vitest Worker 起動失敗 | 環境補正済み | 残存 `pnpm check` Process Tree により対象 Test 開始前に Timeout。対象 Tree 除去後に定向 30 件と Portal 219 件を先頭から再実行して合格 |
| OneOps 最初の正式配信 | 合格 | SYSTEM Continuous Delivery、Health 0.18.18、Listener、nginx 構文、最初の三層 Asset Hash |
| OneOps 返工後全量 Check | 合格 | Gateway 279 件、Worker 14 件、Portal 219 件、TypeScript、Vite |
| OneOps 返工後 Operations Script | 合格 | 9 Script |
| OneOps 返工後 Spring Backend | 合格 | 40 件、8 件 Skip、Build Success |
| OneOps 返工後正式配信 | 待検証 | 新 Application Tree と三層 Asset Hash |
| OneOps Browser と Console | `evidence_missing` | Application 内 Browser はローカル Login 画面まで到達。認証済み Session 待ち |
