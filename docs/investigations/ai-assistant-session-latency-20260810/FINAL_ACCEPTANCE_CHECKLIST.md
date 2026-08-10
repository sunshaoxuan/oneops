# 最終受入一覧

## 当初の目的

AIアシスタントの会話読込と削除を利用者操作へ即時に反応させ、CAG 障害、全量 Event、SSE 再接続、削除後の次 Session 読込及び依存サービス停止によって数十秒から数分待機する状態を再発させない。

| No. | 原要求及び制約 | 成果物 | 検証証拠 | 状態 |
| ---: | --- | --- | --- | --- |
| 1 | Session 一覧後の詳細読込を短時間で確定する | JSON 5 秒総予算、Portal Retry 停止 | Timeout Test、API 16 ms | 合格 |
| 2 | 完了済み会話の全量 Event 再取得を廃止する | Compact Task Detail | Route Test、Access Log | 合格 |
| 3 | 逐次応答を維持する | 最新未完了 Task SSE | SSE Test、専用 Session `OK` 応答 | 合格 |
| 4 | 正常 SSE を 30 秒で切断しない | 接続 Timeout 分離 | Unit Test、Runtime Log | 合格 |
| 5 | 削除確認後に履歴行を即時反映する | Optimistic Delete | Portal Test、Browser 64 ms | 合格 |
| 6 | 削除失敗時に状態を復元する | Mutation Rollback | Portal 行動 Test | 合格 |
| 7 | 削除と次 Session 読込を分離する | Query 取消及び選択更新 | Portal Test、Refresh 後削除維持 | 合格 |
| 8 | DB Lock による無期限待機を防止する | 単一 DELETE、DB Timeout | Route Test、DELETE 9 ms | 合格 |
| 9 | 同種遅延を計測可能にする | Nginx Timing Log | Nginx Test、Access Log | 合格 |
| 10 | CAG Scheduler 空転を止める | CAG Scheduler 修正 | CAG Test、20秒差分で Source 更新0件、PostgreSQL CPU 1.53% | 合格 |
| 11 | CAG SSE が長時間 Transaction を保持しない | CAG SSE Session 境界修正 | CAG Test、`idle in transaction=0` | 合格 |
| 12 | CAG PostgreSQL と Redis を異常終了後も復旧する | Container Restart Policy 適用 | `unless-stopped`、隔離 Crash Test で両方 `RestartCount=1`、再 Ready | 合格 |
| 13 | 日本語要件文書を更新する | 要件、調査、試験文書 | Language Test、文書確認 | 合格 |
| 14 | 全関連 Test と Build を成功させる | OneOps 0.18.7、CAG 0.28.3 | 478件、40件、186件、22件、Build | 合格 |
| 15 | 正式 Runtime へ公開する | OneOps、CAG | Health 0.18.7、Ready 0.28.3、Asset Hash | 合格 |
| 16 | 実 Browser で読込、削除、Console を確認する | 専用 Test Session | Browser Timing、Console、トリミング済み Screenshot | 合格 |
| 17 | 実装 Commit、Push、Remote 一致を確認する | `origin/master` | OneOps `fd4e5cb`、CAG `e18fd22` | 合格 |

## 最終判定

全17項目は合格した。正式証拠 Commit と Annotated Tag の作成後に `HEAD == origin/master == Tag` を確認し、Release Gate を閉じる。
