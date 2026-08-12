# 試験結果

更新日: 2026-08-12

| 項目 | 状態 | 結果又は証拠 |
| --- | --- | --- |
| Gateway 最新全試験 | 合格 | Migration 044 追加後の 281 件 |
| Portal 全試験 | 合格 | 33 Files、219 件 |
| Builder Worker | 合格 | 14 件 |
| TypeScript | 合格 | `tsc -b` Exit 0 |
| Production Build | 合格 | Vite 3850 Modules |
| Spring Backend | 合格 | 40 件中 32 件合格、環境条件に該当する 8 件 Skip |
| Operations Script | 合格 | 9 Script と Runtime 契約が合格 |
| Project Language | 合格 | 5 件全て合格 |
| Data Cutover | 合格 | 4 Session、28 Task、Completed 24、Failed 3、Cancelled 1、断線 0 |
| 実 GPT Streaming 能力 | 合格 | HTTP 200、HTTP SSE、Model `gpt-5.6-terra`、推論強度 `MEDIUM` |
| 実 GPT Application Task | 合格 | Local Ledger に Provider Response ID、Provider Output、Token 使用量を保存。公開 API から内部項目を除外 |
| 実 GPT Stop | 合格 | HTTP 202 507 ms、Database Cancelled 確定 6 ms、Cancelled 1、Completed 0、Failed 0 |
| Stop 後の送信 | 合格 | Draft を保持し、後続 Task 一件が Completed |
| Browser Reload と隔離 | 合格 | Cancelled を完全回答へ変換せず、Completed、Model、推論強度を復元。Session 間混在 0 |
| Quick Assistant Menu と Prompt Snapshot | 合格 | 第二階層 Menu、`gpt-5.6-terra`、`MEDIUM`、強化後 Prompt 280 文字と目標言語限定指示を確認 |
| 日中相互翻訳の最終品質 | 待検証 | 初回証拠に日本語助詞「の」の残留を検出。Migration 044 後の新規 Session 3 回は Endpoint の `429 rate_limited` で Failed |
| GPT Endpoint Model 接続 | 合格 | `/models` は HTTP 200、23 ms、10 Model、`gpt-5.6-terra` 有り |
| GPT Endpoint Responses 能力再確認 | 外部状態待ち | Terra、Luna、Sol、GPT 5.5、GPT 5.4、GPT 5.4 mini が HTTP 429、`model_cooldown`。初回確認時の Reset は 544800 秒、151 時間 20 分 |
| 正式文書添付 | 合格 | 文書を含む実 GPT Task が Completed |
| Console | 合格 | Error 0、Warning 0 |
| Screenshot | 一部待検証 | 履歴、Streaming 中 Draft、Cancelled、Quick Assistant Menu、文書添付の五件は合格。翻訳 Screenshot は品質返工後に置換する |
| SYSTEM Continuous Delivery | 合格 | Migration 044 を含む成果物が 2026-08-12 01:23:07 に `delivery_succeeded` |
| 最終全量試験 | 合格 | Gateway 281、Portal 219、Worker 14、TypeScript、Build、Spring、Operations、Project Language |
| Git 差分形式検査 | 合格 | 指定文書更新後の `git diff --check` Exit 0。既存 Working Copy の LF から CRLF への変換 Warning のみ |
