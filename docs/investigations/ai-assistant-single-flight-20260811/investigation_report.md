# AIアシスタント Conversation 単一実行制御 調査報告

## 目的

同じ Conversation の回答が終端状態へ到達する前に次の発言を送信できる状態を解消し、既存回答を継続させたまま新しい Task の作成を原子的に遮断する。

## 調査結果

1. Portal は Task 作成 HTTP 要求の `isPending` だけを送信 Lock に使用していた。HTTP 202 の受信後は CAG Task が実行中でも Composer が再開していた。
2. Portal は複数の未完了 Task が存在すると最新 Task だけを SSE 購読対象にしていた。1 件目の Task は CAG で継続し、画面の購読対象だけが 2 件目へ移るため、質問と回答の対応が混在した。
3. Gateway は発言作成前に CAG Task 一覧を取得していた。その一覧は Routing だけに使用され、未完了 Task の拒否判定が存在しなかった。
4. Gateway の単純な状態確認だけでは、同時要求が同じ空の Task 一覧を読んで 2 件とも作成へ進む競合が残る。
5. Portal の発言 Mutation は処理中に選択中 Session が変わると、送信先と Cache 更新先が一致しない可能性があった。
6. 個人タスクの AI 分析は新しい AI Session を保存した後、共通 Repository の Lock を使用せず最初の CAG Task を作成していた。Session 保存と Task 作成の間に Portal が同じ Session を開くと、二つの作成経路が競合する余地があった。

## 修正方針

1. Portal は Session 詳細未確認、Task 作成 HTTP 実行中又は未完了 Task 存在中を Conversation Lock として扱う。
2. Conversation Lock を入力、`Enter`、送信 Button、添付選択、File Input、貼り付け及び Drag and Drop へ共通適用する。
3. 同期的な Ref Lock で React 状態反映前の二重 Click と連続 `Enter` を抑止する。
4. 発言 Mutation は送信開始時の Session ID を固定し、Task Cache、Session 名、添付及び入力復元を送信元へ限定する。
5. Gateway は PostgreSQL Transaction で Conversation と所有者の Session 行を `FOR UPDATE NOWAIT` により Lockする。Lock 内で Task 一覧を再取得し、未完了 Task を検出した場合は HTTP 409 を返す。
6. 同じ Lock 内で CAG Task 作成と `last_task_id` 更新を完了する。別 Conversation は別の Session 行を使用するため独立して実行できる。
7. 既存 Task の取消しは実行しない。SSE と回答生成を終端まで継続する。
8. 個人タスクの最初の CAG Task も同じ Conversation Lock 内で作成し、共通 Repository の Lock 外から `last_task_id` を更新する旧入口を削除する。

## 状態契約

- 終端状態: `completed`、`failed`、`cancelled`、`canceled`
- 未完了状態: `queued`、`preparing`、`running`、`waiting_approval`、`streaming`、未知状態
- 競合応答: HTTP 409、`AI_ASSISTANT_RESPONSE_IN_PROGRESS`

## 参考調査

OpenAI の公式 API 文書は `response.completed`、`response.cancelled`、`response.failed` を独立した終端 Event として定義している。送信拒否を既存回答の取消しへ変換せず、取消しを明示的な別操作として扱う設計原則を参照した。ChatGPT 画面の Composer 制御そのものを固定契約として説明する公式文書は確認できなかったため、本実装の UI 契約は利用者要求と OneOps の Task 状態を正式根拠とする。

参照: `https://developers.openai.com/api/reference/resources/webhooks`

## 正式検証結果

1. 実装 Commit `53553b6b86c8a3a5a2c92322b4b2b79e6cbb824d` を `origin/master` へ Pushし、SYSTEM Continuous Delivery は 2026年8月11日 16時22分47秒に成功した。
2. 正式 Health は `UP`、Version は `0.18.16`、nginx Upstream は `127.0.0.1:8092` である。443、8092、8093 が Listenし、8094 と 8095 は Listenしていない。
3. 正式配信された `index.html` と Production Build の SHA256 は `C0A122B74245EFE732D95396CB0154C5DF8D8949127982DC2671D205E783BA79` で一致した。正式 Asset は `/assets/index-C22j2zAF.js` と `/assets/index-CiTRjCGf.css` である。
4. 正式 Browser の実行中確認では TextArea、送信 Button、添付 Button、File Input が無効で、Composer は `aria-busy="true"` だった。案内文を表示し、Fill と `Enter` は拒否され、User Message は 4 件のまま増加しなかった。
5. 別 Conversation へ切り替えると Composer は利用可能で `aria-busy="false"` になった。実行元 Conversation へ戻すと Lock が維持され、Conversation 単位の独立性を確認した。
6. 既存回答は取消されず 54 秒で五項目の回答を完了した。終端後は TextArea、添付 Button、File Input が利用可能となり、Composer は `aria-busy="false"`、実行中案内は 0 件になった。
7. 終端後に送信しない確認用 Draft を入力すると送信 Button が利用可能になった。Draft を削除した後も User Message は 4 件のままで、新しい Task は作成されなかった。
8. Browser Console の Error と Warning はいずれも 0 件だった。実行中と終端後の正式 Screenshot は同じ受入 Conversation の同じ Message に対する状態遷移として、Account 表示を除外して証拠 Directory へ保存した。
9. Portal 集中試験 23 件、Gateway と Database と個人タスクの集中試験 39 件、Gateway 274 件、Worker 14 件、Portal 211 件、Backend 40 件、運用 Script 9 件及び日本語規約 5 件が合格した。

## 結論

同じ Conversation では回答生成開始から終端状態まで新しい Task を作成できない。Portal の全入力経路、Gateway の原子的 Lock、個人タスク経路及び送信時 Session 固定が同じ契約を使用する。既存 Task と SSE は継続し、別 Conversation は独立し、終端後だけ Composer が復元する。最終証拠は `evidence_index.md`、`test_results.md` 及び `FINAL_ACCEPTANCE_CHECKLIST.md` に対応付ける。
