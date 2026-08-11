# AIアシスタント入力継続と回答停止 調査報告

更新日: 2026-08-11

## 1. 目的

同じ Conversation の回答生成中に二件目の Task を作成しない単一実行制御を維持しながら、利用者が次回 Draft を入力でき、現在の回答だけを明示的に停止できる ChatGPT 型 Composer へ変更する。

## 2. 調査結果

1. OneOps `0.18.17` は Session 詳細未取得、Task 作成 HTTP 要求中及び未完了 Task を一つの `conversationLocked` として扱い、TextArea、送信、添付、Paste 及び Drag and Drop をすべて無効化していた。
2. OneOps Gateway は PostgreSQL の Conversation 行 Lock と CAG Task 一覧の再確認により、同じ Conversation の二重 Task 作成を HTTP 409 で防止していた。この Server 側の単一実行制御は維持する必要がある。
3. CAG `0.28.3` は QueueItem 取消、Worker の取消確認、Runtime Process の停止及び `task.cancelled` SSE を実装済みだったが、Task ID から利用できる公開 Cancel API を持っていなかった。
4. OpenAI の公開 API 資料では取消しが独立操作と独立終端状態として扱われる。ChatGPT Composer の完全な公開 UI 契約は確認できないため、画面操作は今回の利用者要求を正式根拠とする。

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

## 8. 最初の正式配信の実行証拠

SYSTEM Continuous Delivery は `2026-08-11T20:14:38.2620122+09:00` に開始し、`20:15:38.3154080+09:00` に成功した。HTTPS と 8092 は Health `UP`、Version `0.18.18` である。8093 は Health と Readiness `UP` であり、現行 Endpoint 契約は Version 項目を返さない。

443、8092、8093 は Listenし、8094 と 8095 は Listenしていない。nginx Upstream は `127.0.0.1:8092`、nginx 構文検査は成功した。最初の配信時点の Build、配信 Directory 及び HTTPS 応答は `index.html`、`index-Bvl4Go5a.js`、`index-BQkCaVWd.css` の各 SHA256 が一致した。

終端競合修正後の Application Tree は再配信前であるため、最終 Asset Hash は後続配信で再取得する。

## 9. Browser 境界と残存 Gate

Application 内 Browser は正式 URL へ到達した。Windows SSO の NTLM 認証を完了できず、同じ Tab で OneOps のローカル Login 画面へ戻した。認証後の Composer、Stop、Network、Console 及び公開可能な Screenshot は `evidence_missing` である。

終端競合修正後の全量 Check は Gateway 279 件、Worker 14 件、Portal 219 件、TypeScript 及び Vite Production Build が成功した。Operations Script は9 Script が成功し、Spring Backend は40件中8件 Skip、Build Successである。

正式再配信、認証後 Browser、Console、Screenshot、最終証拠 Commit、Git Tag 及び最終受入は後続段階で記録する。
