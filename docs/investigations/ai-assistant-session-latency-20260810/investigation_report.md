# AIアシスタント Session 読込及び削除応答性能 調査報告

## 調査目的

AIアシスタントで Session を選択した時の読込表示と、履歴行を削除した時の画面反映が長時間継続する事象を、Portal、Spring、Node Gateway、OneOps PostgreSQL、CAG、CAG PostgreSQL 及び Redis の境界で調査した。局所的な表示変更に限定せず、同じ待機を再発させる Timeout、再試行、全量履歴、SSE 及び依存サービスの状態を対象とした。

## 事故時間帯の事実

利用者 Screenshot の作成時刻は 2026 年 8 月 10 日 17:52:33 だった。同時間帯の実行記録は次の状態を示した。

1. CAG PostgreSQL と Redis は停止状態で、18:38:41 頃に起動した。
2. OneOps は 17:51:39 から継続配信を開始し、17:52:11 の失敗後、17:53:35 に再実行して 17:54:22 に成功した。
3. 17:52:39 の Session DELETE は HTTP 200 だった。
4. 17:53:07 から 17:57:13 の Session 詳細及び Event は 500、502、503 を返した。
5. OneOps 操作監査で同系統の要求は 30 秒、60 秒、120 秒単位の所要時間を記録していた。

## 確認した原因

### CAG 要求待機の増幅

旧 Gateway は主 Endpoint と予備 Endpoint の各々を 30 秒で 2 回試行した。Portal の Query は失敗後に同じ詳細要求をさらに 1 回実行した。主と予備の 2 Endpoint が利用不能な場合、Gateway 1 回が最大 120 秒、Portal の再試行を含めると約 240 秒になった。

### 完了済み会話の重複取得

旧画面は Session 選択時に次の 3 系統を同時に開始した。

1. CAG Conversation 詳細
2. CAG Conversation の Task 全件
3. CAG Conversation Event の sequence 0 からの全件

現存会話の実測では Task は 2 件、Event は 882 件、Event 応答は約 1.22 MiB だった。Event の 831 件は `agent.message.delta` だった。完了済み 2 Task の `final_report.summary` は、最終 `agent.message.data.text` と SHA-256 が一致した。したがって完了済み回答のために過去 delta 全件を再取得する必要はない。

### SSE の 30 秒周期切断

JSON と SSE が同じ 30 秒 Timeout Signal を使用していた。接続成立後も Signal が残るため、正常な長時間 SSE が 30 秒で中断し、Browser が再接続していた。完了済み会話も Conversation SSE を維持し、CAG の PostgreSQL Polling と Spring Servlet Thread を継続使用していた。

### 削除の見え方

OneOps PostgreSQL の Session 一覧は 2.3 ミリ秒、所有者確認は 1.3 ミリ秒だった。操作監査上の DELETE は 6 から 11 ミリ秒で、CAG を呼び出していなかった。Portal は DELETE 成功後に初めて履歴行を除去し、選択中 Session の旧詳細及び SSE を明示的に取消していなかった。削除後に次の Session を自動選択し、その CAG 詳細が長時間待機するため、削除全体が停止したように見える構造だった。

### CAG の継続負荷

CAG KnowledgeScheduler は対象 Source に `queued` 又は `running` の Ingestion が存在する場合も処理済みと判定し、待機せず Lease の取得と解放を反復していた。CAG PostgreSQL は約 167 から 172 パーセントの CPU を継続使用し、`knowledge_sources` には大量の更新と dead tuple が発生していた。また、Conversation SSE の初期所有確認に使用した Request Session が StreamingResponse の生存期間中も Transaction を保持していた。

## OneOps 0.18.4 の実装

1. CAG JSON は Endpoint ごとに 2 秒、要求全体で 5 秒とした。
2. 同じ Endpoint の反復を廃止し、一時障害時は次の予備 Endpoint を一度ずつ使用する。
3. SSE の接続 Timeout を接続後の Stream 生存期間から分離した。
4. SSE の Error Header 受信後も接続 Timeout を維持し、停止した Error Body を打ち切って予備 Endpoint へ切り替える。
5. Session 詳細は CAG Task 一覧 1 回だけを取得し、Conversation 詳細及び過去 Conversation Event 全件を取得しない。
6. 完了済み AI 発言は `final_report.summary` から復元し、実行中の最新 Task だけ Task SSE を購読する。
7. Browser の `Last-Event-ID` と要求済み sequence の大きい方から上流 Task SSE を再開し、切断後の Event 再転送を抑止する。
8. `lastTaskId` より前の並行 Task は CAG Task 詳細の Conversation ID を照合してから購読し、所有者境界を維持する。
9. Session 詳細 API は画面が使用する公開項目だけを返す。
10. Portal Query に AbortSignal を接続し、Session 詳細の自動再試行を停止した。失敗時は明示的な再読込操作を表示する。
11. 削除確認前に Session 一覧と対象詳細の在処理 Query を取消し、履歴行と選択状態を即時更新する。削除失敗時は削除前の状態へ戻す。
12. 所有者確認と Session 削除を単一 SQL にし、Lock Timeout、Statement Timeout 及び Query Timeout を設定した。
13. Nginx Access Log に request time と upstream response time を追加した。

## 変更後の読取実測

変更後 Route を実 Agent Gateway 設定と既存 Session に対して読み取り専用で実行した。結果は CAG Task 一覧 1 回、HTTP 200、72.8 ミリ秒、8,878 Byte、Task 2 件だった。Conversation 応答項目は存在しなかった。

## 変更境界

1. CAG Conversation、Task、Event は引き続き正式データソースとする。
2. OneOps に AI メッセージ本文を重複保存しない。
3. Session 削除は現行要件どおり OneOps の所有関係を削除し、CAG に存在しない Conversation 削除 API を新設しない。
4. 利用者が所有しない Conversation と Task の取得を許可しない。
5. CAG Scheduler の Source 認領と Scheduled Ingestion 作成は Source 行 Lock と同一 Source の active Ingestion 再確認で直列化する。
