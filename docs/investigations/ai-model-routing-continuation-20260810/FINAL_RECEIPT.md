# 最終回執

## 現在状態

実装、定向回帰、隔離 Full Suite、Installed app-server Schema、Model Catalog 及び実 Model Turn は完了した。正式配信と Browser 最終受入は継続中である。

## 実装済み成果

1. Task Attempt 単位の `SIMPLE` と `GENERAL` Routing
2. 翻訳を含む会話内 Task Summary の自動継続
3. Task Fingerprint と同一 Task 再実行の一度だけの昇格
4. 問合せ全体分析と Agent 操作の初回 `GENERAL` 選択
5. CAG Task の Model、Effort、Routing Context 監査
6. Codex app-server Thread Resume と Turn Start への Model 適用

## 未完了 Gate

1. CAG と OneOps の正式配信
2. 正式 API による luna、terra、会話継続、再実行昇格の確認
3. Browser、Console、Screenshot

全 Gate が合格するまで正式完了又は正式リリースとして扱わない。

## 初衷級最終受入一覧

| 原要求 | 成果物 | 証拠 | 判定 |
|---|---|---|---|
| 翻訳など軽量 Task は初回に luna を使用する | OneOps Task Router | Routing Test、実 luna low Turn 1698 ms | 合格 |
| 問合せ全体分析と Agent 操作は初回に terra を使用する | Heavy Task Policy | Inquiry Routing Test、実 terra medium Turn 2350 ms | 合格 |
| 同一 Task の再実行は一段階だけ昇格する | Fingerprint と Attempt Policy | 2 回目と 3 回目の Routing Test | 合格 |
| 初回 Task を自動要約して後続へ継続する | Task Summary marker と復元処理 | 本文継続 Test、明示継続 Test | 合格 |
| 1 つの Conversation 内で Task ごとに Model を変える | CAG Task API と app-server Runtime | Protocol Fixture、Installed Schema | 合格 |
| Model、Effort、物理設定 ID、選択理由を監査する | Routing Context と Task Metadata | CAG API と Audit Test | 合格 |
| 正式 Source を Version 管理へ登録する | OneOps `d26cdcf`、`c7dada8`、CAG `ba4d2fa` | Local HEAD と `origin/master` の一致 | 合格 |
| 全回帰と Coverage Gate を満たす | OneOps Gateway 223 件、CAG 隔離 Full Suite | 165 passed、3 skipped、85.46% | 合格 |
| 正式 OneOps と CAG へ配信する | Production Process | OneOps 0.16.3、CAG 旧 OpenAPI | 未合格 |
| AI助手実画面で会話継続と昇格を確認する | Browser、Console、Screenshot | `evidence_missing` | 未合格 |

未合格項目があるため正式完了判定を行わない。配信後は本一覧の先頭から全項目を再実行する。
