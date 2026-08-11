# AIアシスタント入力継続と回答停止 調査報告

更新日: 2026-08-11

## 1. 目的

同じ Conversation の回答生成中に二件目の Task を作成しない単一実行制御を維持しながら、利用者が次回 Draft を入力でき、現在の回答だけを明示的に停止できる ChatGPT 型 Composer へ変更する。

## 2. 調査結果

1. OneOps `0.18.17` は Session 詳細未取得、Task 作成 HTTP 要求中及び未完了 Task を一つの `conversationLocked` として扱い、TextArea、送信、添付、Paste 及び Drag and Drop をすべて無効化していた。
2. OneOps Gateway は PostgreSQL の Conversation 行 Lock と CAG Task 一覧の再確認により、同じ Conversation の二重 Task 作成を HTTP 409 で防止していた。この Server 側の単一実行制御は維持する必要がある。
3. CAG `0.28.3` は QueueItem 取消、Worker の取消確認、Runtime Process の停止及び `task.cancelled` SSE を実装済みだったが、Task ID から利用できる公開 Cancel API を持っていなかった。
4. OpenAI の公式 Webhook Events 資料は `response.completed`、`response.cancelled` 及び `response.failed` を独立 Event として定義する。この状態分離を設計参考とした。ChatGPT Composer の完全な公開 UI 契約は確認できないため、画面操作は今回の利用者要求を正式根拠とする。参照: [OpenAI API Webhook Events](https://developers.openai.com/api/reference/resources/webhooks)、確認日 `2026-08-11`。

## 3. 採用した契約

1. TextArea の利用可否、Task 送信の可否及び添付の可否を独立状態へ分離する。
2. 回答生成中も Session 単位の Draft 編集と通常文字 Paste を許可する。
3. 回答生成中は `Enter` 送信、新規 Task、添付、File Paste 及び Drag and Drop を禁止する。
4. Task ID 確定後は Send と同じ位置へ実心四角の Stop Button を表示する。
5. Stop は選択時の Session ID と最新 Task ID を固定し、Conversation 行 Lock と CAG Task 所属確認の後に冪等な Cancel API を呼ぶ。
6. HTTP 202 は取消受付とし、SSE から終端を確認するまで送信を再開しない。
7. `task.cancelled` は失敗と分離し、現在画面で受信済みの部分回答と Draft を保持する。

## 4. 実装範囲

### CAG 0.28.4

`POST /api/v1/tasks/{task_id}/cancel` を追加した。Queued Task は即時取消、Leased Task は取消要求を永続化して Worker 確認を待つ。終端 Task は冪等、非終端 Task の QueueItem 欠落は HTTP 409 とする。

### OneOps 0.18.18

1. API Client に Session と Task を固定する Stop 呼出しを追加した。
2. Gateway に所有権、最新 Task、CAG Conversation 所属及び Idempotency Key を検証する Stop Route を追加した。
3. Database Lock が Lock 済み行の `last_task_id` を返すようにした。
4. Portal の Composer 状態を Draft、Submission、Attachment へ分離した。
5. Task ID ごとの Stop State と同期 Ref で二重 Click を抑止した。
6. Cancelled Reply、三言語文言、実心四角 Glyph 及び停止後表示を追加した。
7. Stop State を Session ID、Task ID 及び試行 ID の組へ変更し、古い HTTP Callback と不一致 SSE Event を状態へ適用しないようにした。
8. Stop 中に Session を切り替えた場合も開始元 Task の SSE を継続し、開始元 Session の Cache と Reply だけを更新するようにした。
9. 詳細照会が終端を先に返した場合も終端 SSE まで Submission Lock を維持し、Session へ戻った時は詳細 Task と受信済み Reply を照合するようにした。
10. Stop Error を開始元 Session と Task の回答 Turn に限定し、別 Session の画面へ Global Message を表示しないようにした。

## 5. 永続化境界

CAG は取消時に未確定の `final_report` を保存しない。OneOps は現在画面で受信済みの部分回答を Session 切替後も保持する。Browser 再読込後は完全回答として復元せず、CAG の `cancelled` 状態と停止文言だけを表示する。

## 6. 現在の検証結果

1. CAG Backend 全試験: 190 件成功、4 件 Skip、Coverage 85.27%。
2. CAG Frontend: 22 件成功、Production Build 成功。
3. CAG Runtime: 8000、8001、8002 が Version `0.28.4`、Readiness `ready`。
4. CAG 実 Task: Queued から Leased、Cancel 受付、最終 `cancelled`、`task.cancelled` 1 件、Completed 0 件、Failed 0 件。
5. OneOps Gateway 全試験: 279 件成功。
6. OneOps Worker 全試験: 14 件成功。
7. OneOps Portal 全試験: 最初の実装で 213 件成功。終端競合修正後は 33 File、219 件成功。
8. OneOps Production Build: TypeScript と Vite が成功。
9. OneOps Operations Script: 9 Script の検査が成功。
10. OneOps Spring Backend: 40 件中 32 件成功、8 件は Database 環境条件により Skip、Build 成功。

## 7. 静的再監査と返工

最初の `0.18.18` 実装を正式配信後に再監査し、次の競合を検出した。

1. Stop HTTP 202 後の詳細再取得が終端 SSE より先行した場合、Task 詳細だけで SSE と Submission Lock が終了する可能性があった。
2. Session A の Streaming 中に Session B へ切り替え、A が背景で終端へ到達した場合、A へ戻った画面に古い Streaming Reply が残る可能性があった。
3. Stop Error は Global Message であり、Request 中に Session を切り替えると開始元との関係が画面上で失われた。

返工後は Stop 操作を Session ID、Task ID 及び試行 ID で固定し、停止中の全 Session を背景 SSE 対象へ含めた。終端 SSE だけが Stop 操作を削除する。詳細 Task の終端は古い Streaming Reply の表示照合へ使用し、SSE で確定済みの異なる終端状態を変更しない。

終端競合修正後の定向試験は 1 File、30 件成功、Portal 全試験は 33 File、219 件成功、TypeScript と Vite Production Build は成功した。新しい Build Asset は `index-Ll7Ak_gu.js` と `index-BQkCaVWd.css` である。

## 8. 終端競合修正後の正式配信

Application Commit `7231f36a30b3e3349c8f7238ca40f12fe111fd6c` を `origin/master` へ Pushした。SYSTEM Continuous Delivery は `2026-08-11T21:06:19.2563555+09:00` に開始し、`21:06:44.5231407+09:00` に成功した。

配信後の HTTPS と 8092 は Health `UP`、Version `0.18.18` であった。8093 は Health と Readiness `UP`、443、8092、8093 は Listen、8094 と 8095 は非 Listenであった。nginx Upstream は `127.0.0.1:8092`、nginx 構文検査は成功した。

Browser 受入時の Build、配信 Directory 及び HTTPS 応答は次の SHA256 が一致した。

| Resource | SHA256 |
| --- | --- |
| `index.html` | `1639D288555CE1EF80571E5E6E20B0D97EF1F94A4701DF9D9F97FD9118760FD9` |
| `assets/index-Ll7Ak_gu.js` | `11C047F3F8C33B77B9D21BFA646ACDEC65CA3117630164307B7AF048F4607658` |
| `assets/index-BQkCaVWd.css` | `4A950F2A22583FAFC93BB9523AD8038F1764A11F2A6C72FBC839418DE8FFD168` |

## 9. 正式 Browser 受入

正式 URL `https://192.168.20.54/ai-assistant` の認証済み Session で、制御済み Conversation A と Conversation B を使用した。

1. Conversation A の生成中は TextArea が有効で、通常文字 Paste、選択、削除、Backspace 及び `Shift + Enter` の改行が動作した。`Enter` は新しい発言を作成せず、画像 Clipboard Paste は添付を増加させなかった。
2. Draft `停止後も保持する次の下書き` を保持した状態で、添付 Button と File Input は無効、Send Button は非表示、同じ位置の実心四角 Stop Button は表示された。
3. Stop 選択直後は「回答の生成を停止しています」を表示した。TextArea と Draft は維持し、送信、添付及び File Input の Lock を継続した。
4. `task.cancelled` 終端後に Conversation B へ切り替えた時は Stop 状態と Stop Error が表示されず、B の TextArea は空であった。Conversation A へ戻ると `cancelled` 終端、元の Draft 及び受信済み部分回答が表示された。停止処理中に別 Session へ切り替えた場合の背景 SSE は Portal の競合 Test で確認した。
5. Cancelled 表示は「回答の生成を停止しました」の中立的な Status で、失敗 Alert は 0 件であった。Stop Button と処理 Loader は消え、Send、添付及び File Input は復元した。
6. nginx Access Log は `2026-08-11 21:17:44 +09:00` に Session `981873a5-47d4-49d4-bd3d-f8e34860d37b`、Task `69c96824-96e2-4073-846b-3b22ba09d8ed` の Cancel Route を一件だけ記録し、応答は HTTP 202 であった。CAG は `task.cancelled` 一件、`task.completed` 0 件、`task.failed` 0 件を記録した。
7. 保持 Draft の送信はクイックナビゲーションの User Turn を 3 件から 4 件へ一件だけ増加させた。Access Log の Message POST も `2026-08-11 21:19:44 +09:00` の一件であり、後続 Task `d112c1b5-5767-4879-8822-ef9da4413650` は `task.completed` 一件、`task.cancelled` 0 件、`task.failed` 0 件で自然完了した。
8. 自然完了後は Stop と待機 Loader が消え、TextArea、Send 能力、添付及び File Input が復元した。
9. Page Reload 後も Cancelled 状態と停止文言を復元し、古い Streaming Loader は表示されなかった。未確定の部分本文は `final_report` として永続化しない正式境界に従い、完全回答として復元されなかった。
10. Browser Console は Error 0 件、Warning 0 件であった。

Browser API は File Data を伴う Drag and Drop の直接注入を提供しないため、実 Browser の直接操作証拠は File Input Disabled、画像 File Paste の拒否及び添付件数不変までである。Drag and Drop Handler の送信 Lock は Portal Test で確認した。

Browser の Conversation B への切替は `task.cancelled` 終端後に実行された。停止処理中の切替と背景 SSE 継続は Portal の終端競合 Test が直接証拠であり、正式 Browser の時間順証拠は取得していない。現在の Task 取消、Draft 保持、終端後の Session 隔離及び後続自然完了は正式 Browser と Runtime で確認した。

## 10. Screenshot 証拠

全 Screenshot は Account 情報を含む固定 Header を除外し、AIアシスタント Region `left=102`、`top=88`、`width=1290`、`height=1006` だけを保存した。

| 状態 | File | SHA256 |
| --- | --- | --- |
| 生成中 | `docs/evidence/ai-assistant-interruptible-generating-0.18.18.png` | `0985DD33949A03C12FC2FB41F3B94367C0145B577A5D8A56C555950D2FD512E9` |
| Stop 要求中 | `docs/evidence/ai-assistant-interruptible-stopping-0.18.18.png` | `A7A51A09164A80F0C0F5B6E69D37FBA71ABB2F132D7C227F01B2E180556A76D4` |
| Cancelled | `docs/evidence/ai-assistant-interruptible-cancelled-0.18.18.png` | `8A84393DA8B310936167EE18DFE5617FB3C7C1B4D6066C423E6B052EDD0AE501` |
| 自然完了 | `docs/evidence/ai-assistant-interruptible-natural-complete-0.18.18.png` | `F73F35EFAAD702780AB28E9BE9E1DE3AE2B50F759B40C976308909292EE652FB` |

## 11. 結論

回答生成中の入力継続、同一 Conversation の単一 Task、明示 Stop、Stop 受付後の終端待機、Session 間隔離、Draft と部分回答の保持、自然完了及び Reload 復元は、Source、Unit Test、正式 Runtime、Access Log、Browser DOM、Console 及び Screenshot の各証拠で合格した。

正式Tag `v0.18.18`は最終Application Commit `7231f36a30b3e3349c8f7238ca40f12fe111fd6c`を指す。Browser受入後にQuick Navigationの`0.18.19`が同じ`master`へ追加され、現行BranchとRuntimeは`0.18.19`へ前進した。`v0.18.18^{}`はLocalとRemoteで`7231f36a30b3e3349c8f7238ca40f12fe111fd6c`に一致し、`v0.18.19`の祖先であるため、0.18.18のApplication Treeを一意に再現できる。
