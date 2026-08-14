# テスト結果

| 検証 | 結果 | 証拠又は次の処理 |
|---|---|---|
| Gateway 個人タスク集中試験 | 合格 | 26 件成功 |
| TypeScript Build 検査 | 合格 | `tsc -b --pretty false` 終了 Code 0 |
| Portal 集中試験 | 合格 | 19 件成功。初回 Worker 起動時間切れ後に再実行 |
| 全量 Gateway | 合格 | 317 件成功 |
| Worker | 合格 | 18 件成功 |
| Portal 全量 | 合格 | 273 件成功 |
| Production Build | 合格 | 3854 Modules |
| 運用 Script | 合格 | 9 件成功 |
| 実 Database 摘要 | 合格 | expectedScheduled 1、actualScheduled 1、五項目返却 |
| 正式 Rolling 配信 | 合格 | 2026-08-14 14:53:29 delivery_succeeded |
| Edge 正式 HTTPS | 部分合格 | 正式 URL と OneOps タイトルを確認。認証済み DOM、Console、Screenshot は時間切れ |
| Codex 内蔵 Browser | 不合格 | 正式 HTTPS 遷移が時間切れ |

認証済み Home の DOM、Console、Screenshot は `evidence_missing` である。
