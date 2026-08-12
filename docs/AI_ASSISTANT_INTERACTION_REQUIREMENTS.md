# AIアシスタント会話インタラクション要件

更新日: 2026-08-11

## 1. 目的

AIアシスタントの既存配色、文字組み、余白、角丸及び OneOps Brand 表現を維持しながら、利用者が処理中の状態、回答後の操作、長い会話内の現在位置、入力方法及び次に送信できる時点を理解しやすくする。

## 2. 参考画面から採用する原則

`https://beautiful-ui-five.vercel.app/` の明色表示を操作して確認した。OneOps では次の原則を採用する。

1. AI の処理を状態名と段階で表示し、必要な時だけ詳細を展開できる。
2. 完了した回答の近くへ、その回答に対する操作を配置する。
3. 長い会話で利用者が過去を読んでいる間は位置を保持し、明示操作で最新会話へ戻れる。
4. 入力欄は Focus と利用可否を明確にし、送信可能な時は送信と改行の Keyboard 操作を確認できる。
5. Animation は処理中の意味を補助する範囲に限定し、Reduced Motion を尊重する。

## 3. 実装要件

### 3.1 処理状況

1. `QUEUED`、`RUNNING`、`STREAMING`、`COMPLETED` を依頼受付、回答準備、回答生成、完了へ対応させる。
2. Task の `created_at` と `completed_at` を使用して経過秒数を表示する。
3. 本文受信中は処理状況を展開し、完了後は要約表示へ折り畳める。
4. Backend が提供しない推理内容、検索内容、Tool 実行内容及び根拠を生成しない。

### 3.2 回答操作

1. 完了した回答へコピー操作を表示する。
2. コピー成功と失敗を同じ位置で短時間表示する。
3. Keyboard Focus と Touch 操作から利用できる。

### 3.3 会話追従

1. 利用者が会話末尾付近にいる時だけ Streaming 更新へ追従する。
2. 利用者が過去の会話へ移動した時は自動追従を停止する。
3. 自動追従を停止した時は、最新会話へ戻る操作を会話領域内へ表示する。
4. Reduced Motion では Smooth Scroll を使用しない。
5. Streaming 中と完了後で会話領域の横幅を同一に保ち、長い回答を領域内で折り返す。
6. 会話領域は縦方向だけを Scroll 対象とし、回答生成による横方向 Scrollbar を表示しない。

### 3.4 クイックナビゲーション

1. 一つの目盛りを一つの会話 Turn と対応させ、同じ目盛りから利用者の発言と AI 回答の節選を参照できるようにする。
2. 目盛りの Hover 又は Keyboard Focus で、利用者の発言と AI 回答を明示 Label 付きの Preview Card として表示する。
3. Preview Card は会話領域内の独立 Layer へ配置し、上端及び下端の目盛りでも会話領域から欠落させない。
4. Preview Card は Page Root へ Popup 要素を追加せず、Hover 開始時、表示中及び終了時に Page Root の Scrollbar を生成しない。
5. 目盛りの Click で対応する利用者の発言へ移動する。

### 3.5 クイックアシスタント購読

1. 各クイックアシスタントへ一つの小さな購読アイコンを表示する。
2. 購読状態は利用者単位の Portal 偏好として快捷助手の物理 ID だけを保持する。
3. 一つ以上を購読した場合、「新しい話題」の直下へ購読区を表示する。
4. 購読区には現在有効な購読済み機能を並べ、クリックで対応する専用会話を作成する。
5. 購読解除は同じアイコンから実行でき、解除後は購読区から直ちに消える。
6. ショートカット管理者が名称や説明を更新した場合、購読区は最新の公開データを表示する。

### 3.6 Composer

1. Focus 時の入力境界を既存 Brand 色で明確にする。
2. `Enter` が送信、`Shift + Enter` が改行であることを表示する。
3. 狭い画面では Keyboard 説明を省略し、入力幅を優先する。
4. 現在の Conversation に未完了 Task が存在する間も TextArea を有効にし、Session 単位の次回 Draft を入力、選択、削除及び編集できる状態を維持する。
5. 未完了 Task の間は通常文字 Paste を Draft 入力として許可する。ファイル Paste、大容量文字列の添付変換、添付 Button、File Input 及び Drag and Drop は同じ Attachment Lock で無効化する。
6. 未完了 Task の間は `Enter` による送信を抑止し、`Shift + Enter` の改行を許可する。Task の終端後は `Enter` 送信を復元する。
7. Session 詳細の取得が完了する前は TextArea、送信及び添付を無効化する。発言作成 HTTP 要求の実行中は TextArea の編集を許可し、送信及び添付だけを無効化する。
8. `Enter` と送信 Button は同じ同期的な Submission Lock を使用し、状態反映前の連続操作も 1 回の要求に限定する。
9. Task ID が確定した未完了 Task では、Send Button と同じ位置、形及び寸法で実心四角の Stop Button を表示する。Task ID がまだ返っていない発言作成 HTTP 要求中は Stop を表示せず、要求中表示とする。
10. Stop Button は選択時の Session ID と Task ID を固定し、Session ID、Task ID 及び試行 ID の組で二重 Click と古い HTTP Callback を分離する。Stop 要求中も TextArea の編集を許可する。
11. Stop HTTP 202 後も Stop 中表示と Submission Lock を維持し、別 Session へ切り替えた場合も開始元 Task の SSE を継続する。開始元 Task の `task.cancelled`、`task.completed` 又は `task.failed` を受信した後に Send を復元する。
12. 実行中は「次のメッセージを入力でき、送信前に完了を待つか生成を停止する」に相当する案内を日本語、中国語及び英語で表示する。Stop 要求中は同じ位置へ停止処理中の案内を表示する。
13. `task.cancelled` は `FAILED` と分離し、受信済みの部分回答を保持して処理 Loader と工程表示を終了し、中立的な停止文言を表示する。
14. Stop 要求が失敗した場合は SSE、部分回答及び Draft を維持し、開始元 Session と Task にだけ再試行可能な三言語エラーを表示する。Task の終端前に Send を復元しない。
15. 発言と Stop の非同期処理は開始時の Session ID、Task ID 及び試行 ID を保持し、利用者が別 Session へ移動した後も Task Cache、Session 名、Reply、Stop 状態、添付状態及び入力復元を開始元 Session だけへ適用する。不一致 Event と古い試行の Callback は状態へ適用しない。

## 4. 非採用範囲

1. 参考画面の暗色 Theme、Logo、Texture、Typeface 及び配色は採用しない。
2. Source 一覧、Follow-up 提案、Model Picker、Dictation 及び Tool Chip は対応する Backend 契約がないため今回追加しない。
3. 思考過程を模した文章や架空の進捗は表示しない。

## 5. 受入条件

1. 既存の三言語 UI で処理状況、コピー、最新会話及び Composer 操作説明が表示される。
2. 処理段階は既存 SSE 状態と Task 時刻だけから計算される。
3. Streaming 中の自動追従と、過去閲覧中の位置保持を確認できる。
4. コピー成功と失敗の表示を確認できる。
5. PC、狭幅、Reduced Motion で操作可能である。
6. クイックナビゲーションの Hover 前後で Page Root の幅と高さが変化せず、Scrollbar が点滅しない。
7. Streaming の開始、本文受信、長文生成及び完了後で会話領域の `scrollWidth` と `clientWidth` が一致する。
8. Portal Test、Production Build、配信、Browser、Console 及び Screenshot 検証が合格する。
9. Task 実行中も文字入力、削除、選択、通常文字 Paste 及び `Shift + Enter` 改行を実行できる。
10. Task 実行中は Mouse、`Enter`、ファイル Paste 及び Drag and Drop の各入口から同じ Conversation へ 2 件目を送信できない。
11. Send と同じ位置に Stop を表示し、選択時の最新 Task だけを取消す。Stop 中の二重 Click は 1 件の要求に限定される。
12. Stop HTTP 202 後も SSE と Submission Lock を維持し、終端通知後に同じ Conversation の添付及び送信を再開できる。
13. Stop 後は受信済みの部分回答と Draft を保持し、失敗 Alert と異なる停止状態を表示する。
14. Stop が失敗した場合は回答生成と SSE を継続し、同じ Stop 操作を再試行できる。
15. 実行中も別 Session への切替、新規話題及び他画面の操作を継続できる。
16. Session 切替を送信要求又は Stop 要求と同時に行っても、開始元と切替先の Task、入力、Reply、Stop 状態、添付及び Session 名が混在せず、開始元の停止 SSE が終端まで継続する。
