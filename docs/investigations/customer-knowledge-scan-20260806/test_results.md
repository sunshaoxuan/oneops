# 試験結果

更新日: 2026-08-06

| 試験 | 結果 |
| --- | --- |
| Gateway | 192 件成功 |
| Builder Python | 14 件成功 |
| Portal | 18 File、153 件成功 |
| Portal Production Build | 成功 |
| Spring Backend | 33 件成功、環境条件による Skip 7 件 |
| 運用 Script | 9 Script 解析及び全契約成功 |
| Migration 032 | 正式 PostgreSQL へ適用成功 |
| 物理 ID 及び外部キー | Scan、Candidate、組織、Gateway、契約、VPN、環境の制約を確認 |
| 実 PostgreSQL 反映 | 契約候補 1 件、VPN 候補 1 件を反映後に試験記録を精確削除 |
| CAG 直接検索 | 45 秒及び 60 秒 Timeout |
| CAG 非同期 Task | Task 作成成功。検索中は Task 状態 API も Timeout |
| CAG Task Cleanup | Task と Queue Item を `cancelled` へ確定 |
| 正式配信 | Continuous Delivery 成功、Spring 0.10.0、Asset `index-CCuvtQhe.js` |
| 正式 Asset | 日中英 Scan 文言、Learning Gap、`knowledge-scans/latest` を確認 |
| Browser | ローカルログイン後、正式顧客情報画面へ到達 |
| Browser Console | Error 0、Warning 0 |
| Screenshot | `customer-scan-learning-gap.png` に 9330 の Scan と CAG Timeout を記録 |

正式 Browser で Scan 開始後、`CAG_SCAN_TIMEOUT` と利用者へ手入力を求める前に知識ソース、索引状態及び検索サービスを確認する Learning Gap を表示した。CAG Task は `CAG_SCAN_FAILED` へ確定し、再スキャン操作が有効になった。実候補の正式画面確認は CAG Retrieval 回復後に再実施する。

Scan 終了時に CAG 内部 SQL が Error Message へ含まれる事象を検出した。Gateway は内部 Error を安定した公開 Message へ置換し、Portal は Error Code と Learning Gap だけを表示するよう修正した。

修正後の正式 Browser DOM は内部 SQL 0 件、Console Error 0 件、Warning 0 件であった。Browser Screenshot API は修正後の再取得時に連続 Timeout となったため、Screenshot は修正前に取得済みの正式 `CAG_SCAN_TIMEOUT` と Learning Gap 画面を保持する。修正後画面の Screenshot 再取得は未完了である。
