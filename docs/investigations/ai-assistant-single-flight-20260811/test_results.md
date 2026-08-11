# 試験結果

| 対象 | 結果 | 詳細 |
|---|---|---|
| Portal 集中試験 | 合格 | `ai-assistant.test.ts` 23 Tests。Conversation Lock、全送信入口、終端復元、Session 隔離 |
| Gateway 集中試験 | 合格 | AIアシスタント、Database、個人タスクの 39 Tests |
| Database 集中試験 | 合格 | Transaction、`FOR UPDATE NOWAIT`、Commit、Rollback、55P03、Release |
| `pnpm check` | 合格 | Gateway 274、Worker 14、Portal 211、TypeScript、Production Build 3850 Modules |
| Backend Maven Test | 合格 | 40 Tests、Failures 0、Errors 0、環境依存 8 Skipped |
| 運用 Script Test | 合格 | 9 Scripts、Atomic Publish、Rolling Switch、Readiness、Recovery |
| 正式配信 | 待検証 | Version 0.18.16、Health、Asset Hash |
| 正式 Browser | 待検証 | 実行中 Lock、終端復元、別 Conversation、Console、Screenshot |

Production Build の主要 Asset は `/assets/index-C22j2zAF.js` と `/assets/index-CiTRjCGf.css` である。Vite の既存 Chunk Size Warning は出力されたが、Build の終了 Code は 0 だった。
