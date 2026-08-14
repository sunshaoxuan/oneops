# 試験結果

## 合格

- Gateway 個人タスク試験: 26 件合格
- Gateway 全量試験: 317 件合格
- Portal 通知関連試験: 13 件合格
- Portal 全量試験: 46 Files、273 件合格
- Worker 試験: 18 件合格
- 運用 Script 試験: 9 Script 合格
- Portal TypeScript Build 及び Production Build: 3854 Modules 合格
- 実 Database Migration: `source_system_id`、`source_object_id`、Check 制約、外部 System Foreign Key、Source Index を確認
- 既存候補通知: 1 件中、発生元 System ID 1 件、外部 Object ID 1 件、`candidateId` 付き Action Path 1 件
- 継続配信: `delivery_succeeded`
- 正式 Runtime: 8092 Health `UP`、Legacy Gateway Ready、Upstream Online
- Nginx: `nginx -t` 合格
- HTTPS: HTTP 200
- Production Asset: Dist と Web Root の Hash が一致

## 実行環境補足

最初の実行では PowerShell の `PATH` に Node.js がなく、試験本体の開始前に終了した。Bundled Runtime を明示して再実行した。Vitest の既定 Worker 起動が長時間化したため、本タスクが開始した Worker を終了し、`maxWorkers` を限定して同じ Test Suite を完走した。

## 未完了項目

- 実 Browser DOM、Console、Screenshot: `evidence_missing`
- Edge は自動 SSO 遷移先を Client Policy で遮断し、`ERR_BLOCKED_BY_CLIENT` を表示した。
- Codex 内蔵 Browser は OneOps Login 画面まで表示できたが、認証済み Session がなかった。Password 又は Login 操作は本タスクの承認範囲に含まれないため実行していない。
