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

## 検証状態

Source、Test、正式配信、Browser、Console、Screenshot、Git 及び Tag の証拠は `test_results.md` と `FINAL_ACCEPTANCE_CHECKLIST.md` へ段階ごとに記録する。全項目が合格するまで正式完了として扱わない。
