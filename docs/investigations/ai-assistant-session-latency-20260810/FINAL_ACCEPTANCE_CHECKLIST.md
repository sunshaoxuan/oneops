# 最終受入一覧

## 当初の目的

AIアシスタントの会話読込と削除を利用者操作へ即時に反応させ、CAG 障害、全量 Event、SSE 再接続、削除後の次 Session 読込及び依存サービス停止によって数十秒から数分待機する状態を再発させない。

| No. | 原要求及び制約 | 成果物 | 検証証拠 | 状態 |
| ---: | --- | --- | --- | --- |
| 1 | Session 一覧後の詳細読込を短時間で確定する | JSON 5 秒総予算、Portal Retry 停止 | Timeout Test、Runtime Timing | 実施中 |
| 2 | 完了済み会話の全量 Event 再取得を廃止する | Compact Task Detail | Route Test、Network | 実施中 |
| 3 | 逐次応答を維持する | 最新未完了 Task SSE | SSE Test、Browser | 実施中 |
| 4 | 正常 SSE を 30 秒で切断しない | 接続 Timeout 分離 | Unit Test、Runtime Log | 実施中 |
| 5 | 削除確認後に履歴行を即時反映する | Optimistic Delete | Portal Test、Browser | 実施中 |
| 6 | 削除失敗時に状態を復元する | Mutation Rollback | Portal Test | 実施中 |
| 7 | 削除と次 Session 読込を分離する | Query 取消及び選択更新 | Portal Test、Browser | 実施中 |
| 8 | DB Lock による無期限待機を防止する | 単一 DELETE、DB Timeout | Route Test、DB Timing | 実施中 |
| 9 | 同種遅延を計測可能にする | Nginx Timing Log | Nginx Test、Access Log | 実施中 |
| 10 | CAG Scheduler 空転を止める | CAG Scheduler 修正 | CAG Test、CPU Sampling | 実施中 |
| 11 | CAG SSE が長時間 Transaction を保持しない | CAG SSE Session 境界修正 | CAG Test、pg_stat_activity | 実施中 |
| 12 | CAG PostgreSQL と Redis を再起動後も復旧する | Container Restart Policy 適用 | Docker Inspect、再起動後 Health | 実施中 |
| 13 | 日語要件文書を更新する | 要件、調査、試験文書 | Language Test | 実施中 |
| 14 | 全関連 Test と Build を成功させる | OneOps 0.18.4、CAG 0.28.2 | Test Log、Build Log | 実施中 |
| 15 | 正式 Runtime へ公開する | OneOps、CAG | Health、Readiness、Version | 実施中 |
| 16 | 実 Browser で読込、削除、Console を確認する | 専用 Test Session | Browser Timing、Console、Screenshot | 実施中 |
| 17 | Commit、Push、Remote 一致を確認する | `origin/master` | Git Hash | 実施中 |
