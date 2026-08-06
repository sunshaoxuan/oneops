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
| 本番 REGENERATE | 成功、取得 0 件、STALE 500 件 |
| Revision 一致 | `filter_revision=2`、`last_generated_filter_revision=2` |
| Candidate Repository | `PENDING=0`、`STALE=500`、旧 500 件は CLOSED かつ U-PDSサポート |
| Portal 最終 Test | 18 File、154 件成功、0 件失敗 |
| Portal 最終 Production Build | 成功 |
| Continuous Delivery | 2026-08-06 13:00:41 JST 成功 |
| Nginx 構成 | Syntax と Test 成功 |
| HTTPS と Health | `/tasks` 200、Health `UP`、上位 Version `0.10.1` |
| Runtime Port | Nginx 443、Gateway 8092、Spring 8093 の待受を確認 |
| Desktop Browser | 1265px、`v0.10.1`、候補 0、横方向超過なし |
| Narrow Browser | 390px、Document、Drawer、Drawer Body の Scroll Width が Client Width と一致 |
| Browser Console | Error 0 件、Warning 0 件 |

Production Build の Chunk Size Warning は既存構成の警告であり、Build 成否へ影響しない。
