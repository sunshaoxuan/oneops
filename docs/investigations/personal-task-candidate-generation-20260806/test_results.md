# 検証結果

| 検証 | 結果 |
| --- | --- |
| Gateway と問合 Source Test | 46 件成功、0 件失敗 |
| Portal Test | 154 件成功、0 件失敗 |
| Spring Backend Test | 33 件実行、0 件失敗、7 件環境依存 Skip |
| TypeScript Build | 成功 |
| Vite Production Build | 成功 |
| Migration Transaction Dry Run | 成功、Rollback 済み |
| Diff Check | 成功 |
| 運用 Script Test | 9 Script 解析、全受入項目成功 |

Production Build の Chunk Size Warning は既存構成の警告であり、Build 成否へ影響しない。
