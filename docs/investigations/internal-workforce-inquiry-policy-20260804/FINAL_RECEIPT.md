# 最終受入記録

状態: 正式実行環境の受入完了、Git 配信確認待ち

## 当初目的との逐項照合

| 項目 | 合否 | 成果物及び証拠 |
| --- | --- | --- |
| 既存利用者及び RBAC の再利用 | 合格 | Identity Service、既存 Role Assignment、利用者編集画面 |
| 顧客組織から分離した社内部門 | 合格 | `internal_departments`、技術サービス部と TS2 課、E-11 |
| 複数所属と主所属 | 合格 | `user_department_memberships`、E-13、E-16 |
| 部門別業務職責 | 合格 | 四職責、`user_responsibility_assignments`、E-11、E-13、E-16 |
| 独立した問合検索 Template | 合格 | `inquiry_search_templates`、E-12 |
| 五種類の既定割当 | 合格 | SYSTEM、DEPARTMENT、RESPONSIBILITY、ROLE、USER、E-12 |
| 単一 Template 解決と同順位エラー | 合格 | Workforce Policy Service 試験及び API 試験 |
| `TODAY` の動的変換 | 合格 | 正式日付 2026-08-04、E-14 |
| 担当者実値の失効保護 | 合格 | 失効警告、全担当者への退化防止、E-15 |
| 初回自動検索と適用元表示 | 合格 | `500 / 804`、TS2 既定元、E-14 |
| 利用中条件の復元 | 合格 | Ticket 94056 の更新後復元 |
| 既定への復元 | 合格 | Ticket 条件消去後の既定再適用 |
| 個人プロフィールの参照表示 | 合格 | TS2 課、兼務所属、技術職責、E-16 |
| 管理者のみの保守 | 合格 | Permission、管理 API、管理画面の権限制御試験 |
| 正式成果物の安定稼働 | 合格 | Version 0.9.1、72 秒 24 回同一 PID、Health UP |
| 一時受入データの削除 | 合格 | 関連九分類が全て 0 件 |

正式 Browser 受入中に検出した Migration 再実行障害は修正し、最終受入全体を先頭から再実行した。Gateway、Builder、Portal、Spring Boot、正式 PostgreSQL、Package、正式 Portal、Console、Layout、Screenshot 及び Runtime Stability は全て合格した。

残条件は、この成果物を `master` へ Commit し、`v0.9.1` Tag と共に `origin` へ Push した後、Local HEAD、Remote Master、Tag、正式 Health 及び Portal Asset の一致を確認することである。
