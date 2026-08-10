# 最終受入記録

対象日: 2026-08-11 JST

OneOps Version: `0.18.7`

CAG Version: `0.28.3`

状態: 実装、自動試験、Runtime、Browser、Network 相当 Access Log、Console 及び安全な Screenshot の受入合格

## 最終成果

* AI Session 詳細は完了済み Task Summary を1回取得し、過去 Conversation Event 全件を再取得しない。
* CAG JSON は5秒の全体予算内で確定し、Portal は長時間要求を自動再試行しない。
* 実行中最新 Task だけ SSE を購読し、完了済み会話は Polling を継続しない。
* 削除確認後は対象 Query と SSE を取消し、履歴行を即時除去する。失敗時だけ状態を復元する。
* AIアシスタント画面は Workbench の Dashboard GET、SSE 及び個人タスク概要を停止し、認証 Session の権限反映だけを維持する。
* 組織機関コンテキストは物理 ID、権限 Signature 及び Snapshot 時刻で保持し、管理画面の限定 Snapshot と古い Cache による上書きを防ぐ。
* CAG の Streaming Route と Rejection CSV は短命 Database Session を使用し、Ingestion SSE は企業知識画面の Lifecycle に限定する。

## 最終検証

* OneOps: Gateway 261、Builder 14、Portal 203、Spring 40件中32件合格、8件環境条件 Skip、Production Build、Operation Script、Nginx 構文、Project Language と Version 5件合格
* CAG: Backend 186件合格、4件 Skip、Coverage 85.11%、Frontend 22件、Production Build、PowerShell 11件、Compose 合格
* Runtime: OneOps `UP / 0.18.7`、CAG 3系統 `ready / 0.28.3`
* Browser: AI画面60秒以上の対象背景要求0件、Session API 16 ms、削除行64 ms、DELETE 9 ms、Refresh 後も削除維持
* Database: CAG Ingestion SSE 接続中 `idle in transaction=0`
* Scheduler: 20秒で Source 更新差分0件、CAG API CPU 増分0.062秒、PostgreSQL CPU 1.53%
* 依存自動復旧: PostgreSQL と Redis の隔離 Crash Test で各 `RestartCount=1` と再 Ready を確認。現行 Container は無停止
* Console: OneOps と CAG の Application Warning 0件、Error 0件
* Screenshot: `browser-ai-assistant-safe-session-0.18.7.png` と CAG 0.28.3 の安全なトリミング済み画像。OneOps SHA-256 は `515431212B480E0C5238E4095AAEF5C3E338C7DDE012F2598982FB5AED38A87F`

## データ保護

専用 Test Session は削除済みである。個人情報を含む旧 Screenshot は削除した。正式証拠には Password、Token、API Key、Cookie、UNC Path、Source 名、既存会話本文及び既存 Profile を保存していない。

## 権限境界

現行 `SYSTEM_ADMIN` Role は保存済み権限として `customer.knowledge.manage` を持たない。OneOps は契約どおり顧客情報 CAG 分析を表示せず、既定の Model API へ遷移する。本タスクは Role 権限を変更せず、CAG の直接 Browser 受入と自動試験で Streaming 修正を検証した。

## Release Gate

正式証拠 Commit を両 Repository の `origin/master` へ Push し、Annotated Tag `v0.18.7` と `v0.28.3` を同じ Commit に作成して Push する。`HEAD == origin/master == Tag` の確認後に正式 Release とする。

## Rollback

重大な Runtime 障害が確認された場合は承認済みの直前 Release Commit を再配信する。OneOps PostgreSQL、CAG PostgreSQL、Redis、Workspace、既存 Session 及び Ingestion Data は削除しない。Rollback 後は最終受入一覧を先頭から再実行する。
