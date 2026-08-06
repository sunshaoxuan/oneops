# 証跡索引

| ID | 主張 | 証跡 | 確度 | 制約 |
| --- | --- | --- | --- | --- |
| E-01 | 保存条件は `open` と `X02851` | PostgreSQL 読取専用 Query | 高 | 2026-08-06 の現行データ |
| E-02 | 500 件は全件 CLOSED かつ U-PDSサポート担当 | PostgreSQL 集計、提示画像 | 高 | 外部全 75,452 件の先頭 500 件 |
| E-03 | `X02851` は担当者選択値として無効 | 外部 `#id_oc` 432 件の読取結果 | 高 | 読取時点の外部 Options |
| E-04 | 現在利用者の担当者値は `113210` | 外部 `#id_oc` の `社内/孫 紹煊` | 高 | 表示名一致による本人確認 |
| E-05 | 有効な本人担当者と OPEN の検索結果は 0 件 | 外部サイト読取専用検索 | 高 | 2026-08-06 の検索結果 |
| E-06 | 無効値検索は全件一覧へ退行する | 外部サイト読取専用検索、実件数 75,452、表示 500 | 高 | 外部画面の理由表示は未解析 |
| E-07 | 完了状態の実値は `close` | 外部 `#id_s` Options | 高 | Portal は `closed` を保存する |
| E-08 | 候補は定期同期された DB Snapshot | `personal-task-connectors.mjs`、`personal-task-database.mjs` | 高 | UI に明示的な定期 Polling はない |
| E-09 | 条件変更後に既存 PENDING を失効しない | `upsertCandidates` | 高 | Repository 単体の現行契約 |
| E-10 | ADOPTED は候補へ戻らない | `adoptCandidate`、`upsertCandidates` | 高 | 外部 Link は同期更新される |
| E-11 | DISMISSED は外部更新時に戻る | `upsertCandidates` の CASE | 高 | 外部更新日時の品質に依存する |
| E-12 | Cursor の項目名が接続器と Source で不一致 | `modifiedFrom` と `updatedFrom` | 高 | 現行コードの静的確認 |
| E-13 | 認証済み Browser 検証は未完了 | 内蔵 Browser が Windows ドメイン認証確認で停止 | 高 | 提示画像で表示を確認 |
