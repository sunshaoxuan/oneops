# 最終受入一覧

| 番号 | 当初要求又は制約 | 成果物 | 検証証拠 | 状態 |
|---|---|---|---|---|
| 1 | 回答未終了時に同じ Conversation へ 2 件目を送信できない | Portal Conversation Lock | Portal 23 Tests、正式 Browser の実行中 DOM と Screenshot | 合格 |
| 2 | 既存回答を取消さず終端まで継続する | SSE と Task 継続契約 | Gateway Test、正式 Browser で 54 秒後に回答完了 | 合格 |
| 3 | Mouse、Enter、添付、Paste、Drag and Drop を全て隔離する | 共通 Lock | Browser で TextArea、送信、添付、File Input の無効化と Fill、Enter 拒否。Paste、Drag and Drop は Portal Test | 合格 |
| 4 | Frontend を迂回した要求も原子的に拒否する | PostgreSQL Row Lock、HTTP 409 | Database Test、Gateway Test | 合格 |
| 4.1 | 個人タスク AI の Task 作成も同じ Lock を使用する | Personal Task Prompt Service | Gateway Test | 合格 |
| 5 | Task 終端後に送信能力を復元する | 終端状態契約 | Portal Test、正式 Browser で Draft 入力時の送信 Button 有効 | 合格 |
| 6 | 別 Conversation と Session 切替を独立させる | 送信時 Session ID 固定 | Portal Test、正式 Browser の往復切替 | 合格 |
| 7 | 三言語で実行中理由を案内する | Portal 文言と Error Mapping | Portal Test、正式 Browser の日本語案内 | 合格 |
| 8 | 正式要件と変更履歴を更新する | 要件文書、CHANGELOG | 文書確認 | 合格 |
| 9 | 関連 Test と Build を全て合格させる | Test 一式 | `test_results.md` | 合格 |
| 10 | 正式 Runtime を Browser、Console、Screenshot で確認する | 0.18.16 Runtime | Health、三層 Hash、Console 0 件、実行中と終端後の Screenshot | 合格 |
| 11 | 正式 Git と Tag を確定する | `origin/master`、`v0.18.16` | `HEAD == origin/master == v0.18.16^{}` | 合格 |

全項目を当初要求から順に再確認し、全項目が合格した。Source、Test、正式配信、Browser、Console、Screenshot、Git 及び Tag の証拠は `evidence_index.md` と `test_results.md` に対応付けた。
