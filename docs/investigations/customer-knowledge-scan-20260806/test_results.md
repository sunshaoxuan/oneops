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
| Browser | Windows SSO 確認画面で停止。顧客情報画面へ到達できず |
| Browser Console | Error 0、Warning 0 |
| Screenshot | `browser-auth-blocker.jpg` に Windows SSO 停止画面を記録。機能画面は未取得 |

Browser 表示及び Screenshot が未完了のため、正式リリース条件は未達である。
