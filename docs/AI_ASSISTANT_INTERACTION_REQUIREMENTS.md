# AIアシスタント会話インタラクション要件

更新日: 2026-08-11

## 1. 目的

AIアシスタントの既存配色、文字組み、余白、角丸及び OneOps Brand 表現を維持しながら、利用者が処理中の状態、回答後の操作、長い会話内の現在位置及び入力方法を理解しやすくする。

## 2. 参考画面から採用する原則

`https://beautiful-ui-five.vercel.app/` の明色表示を操作して確認した。OneOps では次の原則を採用する。

1. AI の処理を状態名と段階で表示し、必要な時だけ詳細を展開できる。
2. 完了した回答の近くへ、その回答に対する操作を配置する。
3. 長い会話で利用者が過去を読んでいる間は位置を保持し、明示操作で最新会話へ戻れる。
4. 入力欄は Focus を明確にし、送信と改行の Keyboard 操作を常時確認できる。
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

### 3.4 クイックナビゲーション

1. 目盛りの Hover 又は Keyboard Focus で質問と回答の要約を表示する。
2. 要約 Popup は固定 Viewport Layer へ配置し、Page Root の Scroll 範囲を変更しない。
3. Hover 開始時、Popup 表示中及び終了時に Page Root の Scrollbar を生成しない。

### 3.5 Composer

1. Focus 時の入力境界を既存 Brand 色で明確にする。
2. `Enter` が送信、`Shift + Enter` が改行であることを表示する。
3. 狭い画面では Keyboard 説明を省略し、入力幅を優先する。

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
7. Portal Test、Production Build、配信、Browser、Console 及び Screenshot 検証が合格する。
