# 実行記録

更新日: 2026-08-12

## 調査

1. `git fetch origin master --tags --prune` を実行し、`HEAD` と `origin/master` が `83ecfb772a713d1438c92beb5bbfefdfcacdd718` で一致することを確認した。
2. `rg` で AIアシスタント Route、Database、Model Settings、Attachment、API Client 及び Portal Event 契約を追跡した。
3. OneOps PostgreSQL を Read Only Queryし、Session 4 件、Model 設定 2 件を確認した。
4. Agent Gateway の Read Only API で四 Session の CAG Task を照合し、合計 28 件、Completed 24 件、Failed 3 件、Cancelled 1 件を確認した。
5. 画面 Error に対応する CAG Task と Events を取得し、`knowledge.retrieval.failed` 及び `task.failed` の保存内容を確認した。
6. OpenAI 公式の Streaming、Cancel、File Input 及び Image Input 資料を確認した。

## 実装と転入

1. Migration 042 を単独 Transaction で適用し、Session 4 件の Model 欠損 0 件、Task と Event Table の作成を確認した。
2. 一回限り Runner を Dry Runし、4 Session、28 Task、Completed 24 件、Failed 3 件、Cancelled 1 件及び未終端 0 件を確認した。
3. 初回転入は JavaScript Array の PostgreSQL Array 変換により JSONB Check で失敗し、Transaction 全体が Rollback され、Task と Event が 0 件であることを確認した。
4. Task Ledger と転入 Runner を明示 JSON 直列化へ修正し、転入を再実行した。
5. 二回目の冪等転入を実行し、Task 28 件、Event の単一終端競合 0 件、空 Prompt 0 件、空 Completed 回答 0 件、活動 Task 0 件、`last_task_id` 断線 0 件を確認した。
6. 正式 Model 設定で最小 Responses SSE を実行し、HTTP 200、`text/event-stream`、九種類の Event 及び 55,105 Bytes の応答を確認した。API Key と回答本文は記録していない。

## 試験

1. GPT Runner と Routing の対象試験 14 件を実行し合格した。
2. Task Ledger の作成、単一実行及び Stop 競合試験 6 件を実行し合格した。
3. 添付の所有権、Model Input 及び 50,000,000 Bytes 境界試験 3 件を実行し合格した。
4. Gateway の最新全試験 280 件を実行し合格した。
5. Portal 全試験 219 件を実行し合格した。
6. TypeScript `tsc --noEmit` を実行し合格した。

## 今回の作業前半に実施した全体確認

1. Builder Worker 14 件を実行し合格した。
2. Portal 33 Files、219 件を実行し合格した。
3. TypeScript `tsc --noEmit` を実行し合格した。
4. Vite Production Build を実行し、3850 Modules の Build に合格した。
5. Spring 40 件を実行し、32 件が合格、環境条件に該当する 8 件が Skip となった。
6. Operations Script と Project Language 5 件を実行し合格した。

上記は今回の作業前半の結果である。最終成果物に対する全量試験は主作業で再実行する。

## 正式配信と Runtime

1. SYSTEM Continuous Delivery が 2026-08-12 00:44:34 に `delivery_succeeded` を記録した。
2. 正式 Runtime の Version 0.18.20 と AIアシスタント画面の `gpt-5.6-terra`、推論強度「中」を確認した。
3. GPT Task 実行後に CAG の Task 件数を再照合し、28 件から増加していないことを確認した。

この配信後にも Stop Runner と試験へ変更が入ったため、最終成果物の SYSTEM 配信及び Runtime 再確認は主作業で再実行する。

## Browser と Database

1. CAG から転入した Completed、Failed、Cancelled 履歴を正式画面で確認し、履歴 Screenshot を保存した。
2. `gpt-5.6-terra`、推論強度 `MEDIUM` の直接 GPT Session で Streaming を開始し、生成中も Draft を編集できること、Enter が二件目の Task を作成しないこと、添付操作が終端まで無効になることを確認した。
3. Streaming と保持 Draft の Screenshot を保存した。
4. Stop の実 Task 受入で Buffer 済み Provider Event の処理継続を検出し、Runner が各 Event の処理前に Abort 状態を確認するよう修正した。
5. Stop 修正後の受入を最初から再実行し、HTTP 202 まで 507 ms、Database の Cancelled 確定 6 ms、`task.cancelled` 一件、`task.completed` 0 件、`task.failed` 0 件を確認した。
6. Stop 後も Draft が残ることを確認し、同じ Draft を送信した後続 Task が一件だけ作成されて Completed へ到達することを確認した。
7. Reload 後も Cancelled 部分回答を完全回答として復元せず、後続 Completed 回答、Model と推論強度を復元することを確認した。
8. 二つの Session を切り替え、Draft、Stop、Task 及び Reply が混在しないことを確認した。
9. Quick Assistant の第二階層 Menu を展開し、「日中相互翻訳」の開始 Model と推論強度、固定 Prompt による 2 Turn 翻訳を確認した。
10. 正式文書を添付した GPT Task を送信し、添付検証 Code を含む回答と Completed 終端を確認した。
11. Browser Console の Error と Warning が各 0 件であることを確認した。
12. 六件の正式 Screenshot を `docs/evidence` へ保存し、SHA256 を取得した。

## 文書検査

1. 指定文書更新後に `git diff --check` を実行し、Exit 0 を確認した。出力は既存 Working Copy の LF から CRLF への変換 Warning に限られた。
2. 最終受入一覧が 26 項であることと、六件の Screenshot の実 SHA256 が証拠索引の値と一致することを検査した。
3. 指定文書更新後に `node --test gateway/project-language.test.mjs` を実行し、5 件全ての合格を確認した。

## 最終品質返工と Endpoint 診断

1. 旧翻訳 Screenshot に日本語助詞「の」の残留を検出した。
2. Migration 038 の既定 Prompt と Migration 044 を更新し、目標言語限定、原文言語の機能語残留禁止及び送信前確認を追加した。管理者変更済み Prompt は更新条件から除外した。
3. Migration 044 追加後に `pnpm check` を再実行し、Gateway 281、Portal 219、Worker 14、TypeScript 及び Build 3850 Modules が合格した。
4. SYSTEM Continuous Delivery は 2026-08-12 01:22:05 に開始し、01:23:07 に成功した。Database の日中翻訳 Prompt は 280 文字、目標言語限定指示の位置は 88 だった。
5. 新規 Session は `gpt-5.6-terra`、`MEDIUM` と強化後 Prompt Snapshot を保持した。翻訳 Request 3 件は HTTP 429 により `AI_ASSISTANT_MODEL_RATE_LIMITED` で単一 Failed 終端となった。
6. API Key と Provider 本文を出力せず Model 接続を診断した。`/models` は HTTP 200、23 ms、10 Model、Terra 有りだった。
7. Terra、Luna、Sol、GPT 5.5、GPT 5.4 及び GPT 5.4 mini の最小 `/responses` は HTTP 429、Error Type `invalid_request_error`、Code `rate_limited`、内部 Code `model_cooldown` だった。初回確認時の Reset は 544800 秒、151 時間 20 分であり、Endpoint の共通 Credential Pool による外部状態と判定した。

## 残る実行

Endpoint 復旧後の実翻訳、翻訳 Screenshot 置換、限定 Git Stage、Commit、Push、Tag と Remote Equality、自己改善成果更新及び最終受入 26 項の第 1 項からの再実行が残る。
