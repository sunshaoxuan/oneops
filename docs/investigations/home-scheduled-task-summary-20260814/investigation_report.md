# ホーム予定件数の調査・実装記録

## 目的

ホームの個人タスク概要に「予定」件数を追加し、期限超過、今日、長期確認、候補と同じ場所で今後の期限タスク数を確認できるようにする。

## 調査結果

個人タスク画面は、未完了の期限タスクのうち当日終了時刻より後を「予定」として分類していた。ホーム用の `/api/work-center/v1/personal-task-summary` は期限超過、今日、長期確認、候補だけを返し、予定件数を保持していなかった。

## 実装方針

1. 摘要 SQL に翌日以降が期限の未完了期限タスク数を追加する。
2. 共有 API 型へ `scheduled` を追加する。
3. ホームへ日本語「予定」、中国語「计划」、英語「Upcoming」の五つ目のカードを追加する。
4. ホーム専用の五列配置を使用し、既存の狭幅二列、単列規則を維持する。
5. 各概要カードから個人タスク画面の対応タブを開く。

## 境界

新しいタスク状態、Migration、互換処理、Fallback は追加しない。既存の `due_at`、`status`、`task_type` を使用して現在値を集計する。

## 検証状況

Gateway 個人タスク試験 26 件、Portal 集中試験 19 件、全量 Gateway 317 件、Worker 18 件、Portal 273 件、Production Build 3854 Modules、運用 Script 9 件が合格した。正式 Rolling 配信は 2026-08-14 14:53:29 に成功した。

実 Database では摘要 Repository の `scheduled` が同一 SQL 条件の期待値 1 件と一致し、返却項目が `overdue`、`dueToday`、`scheduled`、`reviewDue`、`candidates` の五項目であることを確認した。

Edge は正式 HTTPS の OneOps タイトルまで開けたが、認証済み画面の読み取りと Screenshot が時間切れとなった。Codex 内蔵 Browser は HTTPS 遷移を完了できなかった。認証済み Home の DOM、Console、Screenshot は `evidence_missing` として残す。
