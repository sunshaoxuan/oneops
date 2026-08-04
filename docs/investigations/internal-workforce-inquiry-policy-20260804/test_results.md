# 試験結果

更新日: 2026-08-04

## 自動試験及び Build

| 対象 | 結果 | 件数又は証拠 |
| --- | --- | --- |
| Gateway | 成功 | 158 件 |
| Builder Worker | 成功 | 12 件 |
| Portal | 成功 | 130 件、16 File |
| Portal Production Build | 成功 | Vite 3403 Module |
| Spring Boot | 成功 | 33 件中 26 件成功、DB 条件付き 7 件 Skip |
| 正式 PostgreSQL Workforce 統合 | 成功 | 1 件、自動 Rollback |
| Spring Boot Package | 成功 | 実行可能 JAR 39,318,934 Byte |
| Migration 再実行回帰 | 成功 | 旧 Migration 015 が `INQUIRY` 行を保持 |

## 正式実行時

| 対象 | 結果 | 証拠 |
| --- | --- | --- |
| 正式配信 | 成功 | `delivery_succeeded reason=internal-workforce-0.9.1-rework` |
| Spring 安定性 | 成功 | 72 秒、24 回、同一 PID、HTTP 200、Version 0.9.1、上流 Online |
| 社内部門及び職責 | 成功 | 技術サービス部、TS2 課、親子関係、四職責 |
| Template 管理 | 成功 | 五対象、優先順位、`TODAY`、担当者実値及び表示名 |
| 利用者管理 | 成功 | TS2 課主所属、技術職責及び編集器 |
| 問合支援 | 成功 | 既定元、当日変換、自動検索、検索状態復元及び既定復元 |
| 担当者失効 | 成功 | 失効警告を表示し、全担当者検索へ退化しない |
| 個人プロフィール | 成功 | TS2 課、兼務所属及び `TS2課: 技術` を参照専用表示 |
| Browser Console | 成功 | Error 0、Warning 0 |
| Browser Layout | 成功 | 対象画面で `scrollWidth` と `clientWidth` が一致 |
| Screenshot | 成功 | E-11 から E-16 |
| DB 残留監査 | 成功 | 利用者、Template、Binding、所属、職責、Role、Identity、Session、SSO Ticket が全て 0 件 |

## 検出した不具合と再受入

正式 Browser 受入中に Login が断続的に 502 となる事象を検出した。Migration 027 適用後の `INQUIRY` 行に対して旧 Migration 015 が旧 Check 制約を再作成し、Legacy Gateway と Spring Backend が再起動を繰り返すことが原因であった。Migration 015 と回帰試験を修正し、自動試験、Package、正式配信及び最終受入を先頭から再実行した。

最終門禁の初回 Database 統合試験は、起動 Command の `.env.local` 相対 Path と試験用暗号鍵が不足して失敗した。Application の不具合ではなく試験起動条件の不備である。正式 Database 接続を試験 Process だけへ設定し、試験専用暗号鍵を追加して対象試験の成功を確認した後、Gateway、Builder、Portal、Portal Build、Spring、Database 統合及び Package を先頭から再実行した。
