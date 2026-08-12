# AIアシスタント GPT 直接実行経路 調査報告

更新日: 2026-08-12

## 1. 目的

第一期の AIアシスタント実行経路を CAG Task から、システム設定の OpenAI Model API へ変更する。会話履歴、Quick Assistant の固定 Prompt、Model と推論強度、Streaming、Stop、Draft、添付、Session 隔離及び Reload 復元は維持する。CAG は AIアシスタントの実行経路から削除し、成熟後の再評価対象とする。

## 2. 確認済みの切替前経路

1. 切替前の OneOps は Session 元情報と最新 CAG Task ID だけを PostgreSQL に保存していた。
2. 切替前の会話作成、Task 作成、履歴照会、SSE 及び Cancel は Agent Gateway 経由で CAG を呼び出していた。
3. Model 設定は OpenAI 互換 Endpoint、暗号化 API Key、Model ID 及び推論強度を既に保持している。
4. Quick Assistant は開始 Model、開始推論強度及び System Prompt Snapshot を Session に保存している。
5. 切替対象は Session 4 件、CAG Task 28 件であり、内訳は Completed 24 件、Failed 3 件、Cancelled 1 件だった。全件を OneOps の Local Ledger へ転入した。

## 3. 画面 Error の原因

画面に表示された `Separator is found, but chunk is longer than limit` は CAG Task `671b2469-7ee5-4a9d-a922-512f14ff03fe` の実 Error と一致した。この Task は `knowledge.retrieval.failed` の後に同じ Error を持つ `task.failed` へ到達した。

CAG の Local Codex Runtime は Python `asyncio.create_subprocess_exec` の標準 StreamReader と `process.stdout.readline()` を使用する。一行の JSONL が Buffer 上限を超えた場合、Python `asyncio` は `LimitOverrunError` としてこの文言を生成する。これは GPT の Context Window Error ではない。

GPT 直接経路は Node Fetch の HTTP SSE を使用し、CAG の Python Subprocess と JSONL StreamReader を通過しない。この特定 Error は対象経路から除去される。GPT の Model Context、File 及び Request 制限は別契約として OneOps が入力前に検証し、安定した利用者向け Error Code へ変換する。

## 4. OpenAI 公式契約

1. Responses API は `stream: true` により HTTP SSE を返し、Text Streaming では `response.created`、`response.output_text.delta`、`response.completed` 及び `error` を扱う。
2. 同期 Response の Cancel は接続を終了する方式が公式資料に記載されている。第一期は Time to First Token を優先し、OneOps が Provider 接続を Abortする。
3. Responses API は `input_image` と `input_file` を Data URL で受け取る。各 File は 50 MB 未満、合計 50 MB 以内である。
4. Model は `/models` から取得済みの GENERAL Model 設定を使用する。Quick Assistant が指定した開始 Model 又は通常会話の Default Model を Session 単位で固定する。
5. 正式設定の `gpt-5.6-terra` は 1,050,000 Token の Context Window、128,000 Token の最大出力及び利用 Tier ごとの Rate Limit を持つ。これらは CAG の Python StreamReader 制限と異なる Provider 契約として扱う。

参照資料:

1. [Streaming API responses](https://developers.openai.com/api/docs/guides/streaming-responses)
2. [Background mode](https://developers.openai.com/api/docs/guides/background)
3. [File inputs](https://developers.openai.com/api/docs/guides/file-inputs)
4. [Images and vision](https://developers.openai.com/api/docs/guides/images-vision)
5. [GPT-5.6 Terra](https://developers.openai.com/api/docs/models/gpt-5.6-terra)

確認日: 2026-08-12

## 5. 採用する一期契約

1. Session ID と Task ID は OneOps が UUID として発行する。
2. Task、Task Event、本文、終端、Model Snapshot、推論強度、Routing、添付及び Provider Response ID は OneOps PostgreSQL に保存する。
3. 同じ Session の未終端 Task は PostgreSQL 行 Lock と Task 状態で原子的に一件へ限定する。
4. Gateway Process は Responses API を `store: false`、`stream: true` で呼び出す。
5. Quick Assistant System Prompt と Session Task 状態は毎回の Model Instructions に含める。
6. 過去の User と Assistant Turn は OneOps の履歴から再構成し、現在の添付は Base64 Data URL として送信する。
7. OpenAI SSE は既存 OneOps Event 契約の `task.created`、`task.started`、`agent.message.delta`、`agent.message`、`task.completed`、`task.failed`、`task.cancelled` へ変換する。
8. Stop は最新 Task の Provider 接続を Abortし、Cancel と Complete の競合は Task Row Lock により一つの終端だけを Commitする。
9. Gateway Restart 時に残った Queued 又は Running Task は Failed へ確定し、永続 Lock を残さない。
10. Agent Gateway、CAG Project、Runtime Profile 及び CAG Task API は AIアシスタント経路から削除する。互換 Layer と Runtime Fallback は追加しない。

## 6. 既存履歴の切替

OneOps Session 4 件に属する CAG Task 28 件を OneOps Task Store へ一回だけ取り込んだ。Task ID、表示 Prompt、Inquiry Context、添付 Metadata、Routing、Status、Final Report、Error 及び時刻を保持した。取込件数、Status 内訳及び Session の `last_task_id` 閉包を検証し、AIアシスタント Session から CAG 固有列を削除した。

一回限りの取込 Runner は Task 内一時成果物として扱う。正式 Source に CAG 読取 Fallback は存在しない。最終受入では `.codex-work/ai-assistant-direct-gpt-20260811` を削除して一時成果物の残存 0 件を確認する。

## 7. 実装結果

1. `ai_assistant_tasks` と `ai_assistant_task_events` を追加し、Session ごとの単一活動 Task、Event sequence、Model Snapshot、推理強度、回答、Provider Output、Token、Error、Cancel 及び終端を保存する。
2. AIアシスタント Route は OneOps UUID、Local Ledger、Local SSE と GPT Runner を使用し、CAG Conversation、Task、SSE 及び Cancel API を呼ばない。
3. GPT Runner は正式 Model 設定の `/responses` を `store: false`、`stream: true` で呼び出し、Session の `reasoning.effort`、Quick Assistant の固定指示、Task 状態、履歴及び添付を送る。
4. Stop は Local Task に Cancel Request を保存して対象 HTTP 接続を Abortする。Cancel と Complete の競合は Task Row Lock で一つの終端へ確定する。
5. Provider Output、Provider Response ID、Token 使用量、Model 設定物理 ID、Model 名及び Task Fingerprint は公開 Task API へ返さない。
6. Personal Task の AI 分析は同じ Session、Task Ledger と GPT Runner を使用し、結果項目を `assistantTaskId` へ統一した。
7. 旧 CAG 用の要求 Helper、予備 Endpoint、Prompt Marker、Runtime Profile、Project、署名添付 URL 及び Fallback を削除した。顧客ナレッジ Scan と問合せ分析が使用する Agent Gateway 設定は維持した。
8. 正式 Session は開始 Model `gpt-5.6-terra` と推論強度 `MEDIUM` を固定し、全 Task で同じ Snapshot を使用する。
9. GPT Runner は Provider Event を Local Ledger へ反映する前に Abort Signal を確認し、Stop 後に Buffer 済み Event を処理し続けない。
10. 日中相互翻訳の既定 Prompt は目標言語だけを出力し、原文言語の助詞、語尾及び機能語の残留を送信前に確認する。Migration 044 は管理者が変更していないシステム既定値だけを更新する。

## 8. Data Cutover 結果

Migration 042 を先に適用し、既存 Session の Model Snapshot を補完して Local Task Ledger を作成した。一回限り Runner は CAG の四 Session を再読込し、二 Session に属する 28 Task を Local Ledger へ転入した。

最終集計は Completed 24 件、Failed 3 件、Cancelled 1 件、活動 Task 0 件である。Completed 回答空白 0 件、Task の終端競合 0 件、Session `last_task_id` 断線 0 件を確認した。同じ Runner の二回目実行でも件数と終端が変化しないことを確認した。

初回 Apply は JavaScript Array が PostgreSQL Array として Encoding されたため JSONB Check で失敗した。Transaction 全体が Rollback され、Task と Event が 0 件であることを確認した。正式 Repository と一回限り Runner を明示 JSON 直列化へ修正した後、全件転入と冪等再実行が合格した。

多輪履歴は同じ Session の全終端 Task を時系列順に取得し、過去の利用者入力と完全な Provider Output を再構成する。Task 件数による暗黙の履歴切捨ては行わず、Provider の Context Window 超過は Model API Error として単一の Failed 終端へ確定する。

## 9. 現在の検証状態

### 9.1 自動試験と正式配信

Migration 044 追加後の最終全量試験は、Gateway 281 件、Portal 33 Files 219 件、Builder Worker 14 件、TypeScript、Vite Production Build 3850 Modules、Spring 40 件中 32 件合格と環境条件 Skip 8 件、Operations Script 及び Project Language 5 件が合格した。正式 Model 設定を使用した最小 Responses SSE は HTTP 200、`text/event-stream`、`response.created`、`response.output_text.delta`、`response.completed` を含む九種類の Event と 55,105 Bytes の応答を返した。

SYSTEM Continuous Delivery は Migration 044 を含む Application Tree を 2026-08-12 01:23:07 に配信した。正式 Runtime は 0.18.20、Health `UP`、443、8092、8093 Listen、Upstream 8092、nginx 構文及び Build と配信 Asset SHA256 が合格した。

### 9.2 Browser、Stop 及び Database

1. CAG から転入した Completed、Failed、Cancelled 履歴を正式 Browser で確認した。
2. 直接 GPT の Streaming 中も Draft の入力と編集を継続できた。Enter は二件目の Task を作成せず、添付操作は活動 Task の終端まで無効だった。
3. 最初の Stop 受入では、Provider 接続を Abortした後に Buffer 済み SSE Event を処理し続ける状態を検出した。Runner へ Event 単位の Abort 確認を追加し、Stop 受入を最初から再実行した。
4. Stop 修正後の受入は HTTP 202 まで 507 ms、Database の Cancelled 確定まで 6 ms だった。対象 Task の終端は `task.cancelled` 一件、`task.completed` 0 件、`task.failed` 0 件である。
5. Stop 後も Draft を保持した。同じ Draft の送信は後続 Task を一件だけ作成し、Completed へ到達した。
6. Reload 後も Cancelled 部分回答を完全回答として復元せず、後続 Completed 回答、Model 及び推論強度を復元した。二 Session 間の Draft、Stop、Task 及び Reply の混在は 0 件だった。
7. Quick Assistant の第二階層 Menu を展開し、「日中相互翻訳」の固定 Prompt が 2 Turn の会話で継続することを確認した。その最初の日本語から中国語への結果に日本語助詞「の」が残っていたため、目標言語限定指示と送信前確認を Migration 044 で追加した。
8. 文書添付を含む正式 GPT Task が Completed へ到達した。
9. 今回の GPT Task 実行後も CAG Task は 28 件であり、CAG 側の増分は 0 件だった。
10. Browser Console の Error と Warning は各 0 件だった。
11. 強化後の新規 Session は Prompt Snapshot 280 文字と目標言語限定指示を保持した。正式翻訳 Request 3 件は全て `AI_ASSISTANT_MODEL_RATE_LIMITED` の単一 Failed 終端となった。
12. 同じ Endpoint の `/models` は HTTP 200、23 ms、10 Model、`gpt-5.6-terra` 有りを返した。Terra、Luna、Sol、GPT 5.5、GPT 5.4 及び GPT 5.4 mini の最小 `/responses` は HTTP 429、`model_cooldown` だった。初回確認時の Reset は 544800 秒、151 時間 20 分であり、Model 固有又は CAG 起因ではなく Endpoint の共通 Credential Pool による外部状態と判定した。

### 9.3 正式 Screenshot

1. `docs/evidence/ai-assistant-direct-gpt-history-20260812.png`
2. `docs/evidence/ai-assistant-direct-gpt-streaming-draft-20260812.png`
3. `docs/evidence/ai-assistant-direct-gpt-cancelled-20260812.png`
4. `docs/evidence/ai-assistant-direct-gpt-quick-assistant-menu-20260812.png`
5. `docs/evidence/ai-assistant-direct-gpt-quick-assistant-translation-20260812.png`
6. `docs/evidence/ai-assistant-direct-gpt-attachment-20260812.png`

各 SHA256 は `evidence_index.md` に記録した。

### 9.4 最終受入 Gate

26 項の中間判定は合格 22 項、待検証 4 項である。Endpoint 復旧後の日中相互翻訳、翻訳 Screenshot の置換、限定 Git Stage、Commit、Push、Tag と Remote Equality 及び自己改善成果更新後の一覧全量再実行が残る。全項目が合格するまで最終受領状態へ変更しない。
