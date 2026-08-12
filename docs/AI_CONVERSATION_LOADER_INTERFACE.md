# AI 会話ローダー工程インターフェース

更新日: 2026-08-12

## 目的

AIアシスタントの応答待機とストリーミング受信を、一つの再利用可能な表示インターフェースで扱う。表示層は Provider Response ID、OneOps Local Task ID、Local Task Event Ledger 及び SSE 接続管理を所有しない。呼出元が OneOps Local Task/Event を表示用の会話状態と受信済み全文へ変換し、本インターフェースへ渡す。

## 公開インターフェース

`GenerativeConversationLoader` は次の値を受け取る。

| 項目 | 型 | 意味 |
| --- | --- | --- |
| `phase` | `QUEUED`、`RUNNING`、`STREAMING` | 現在の会話生成段階 |
| `receivedText` | `string` | 現時点までに受信した応答全文 |
| `statusLabel` | `string` | 応答本文が未着のときに表示するローカライズ済み状態文言 |
| `className` | `string` | 呼出元が指定する任意の配置用クラス |

`receivedText` が空の場合は、OneOps の Brand 色を使った三点の小型 Animation と状態文言だけを表示する。待機表示に Panel、枠線、経過秒数、複数種類の Loader は追加しない。三点は通常時に明暗と大きさを順番に変え、Reduced Motion では位置移動を伴わない明暗切替だけを継続する。`role="status"` と `aria-live="polite"` は状態文言だけを通知する。

`receivedText` が存在する場合は `TextLoader` の `cascade` へ受信済み全文を渡す。`STREAMING` の間だけ新規接尾部をアニメーションし、それ以外の段階では静止表示する。

Streaming 本文の Loader、Visual、Copy は会話領域の幅を上限とし、長い日本語、中国語、英数字及び URL を領域内で折り返す。Animation の中間 Frame も会話領域の横幅を変更せず、横方向 Scrollbar を生成しない。

## 会話状態との対応

| OneOps Local Task/Event | 工程段階 | 表示 |
| --- | --- | --- |
| `task.created`、`task.queued` | `QUEUED` | AI の応答待ち文言と三点の小型 Animation |
| `task.started`、Responses API の応答開始待ち | `RUNNING` | 準備中文言と三点の小型 Animation |
| `agent.message.delta` | `STREAMING` | 現時点までの応答全文と接尾部アニメーション |
| `agent.message`、`task.completed` | 完了表示 | 既存の Markdown 表示 |
| `task.failed` | エラー表示 | 既存の失敗表示と `role="alert"` |
| `task.cancelled` | 停止表示 | 現在画面で受信済みの本文を保持し、Loader を終了して中立的な停止文言を表示する。再読込後も `cancelled` を終端として扱い、Streaming Loader を再表示しない |

## 依存関係

外部パッケージ `generative-loaders` は `0.1.1` に固定する。React 18 以上と Node 20 以上が必要で、OneOps の React 19 と Node 24 の範囲内である。ライセンスは MIT である。

外部スタイルは `main.tsx` で一度だけ読み込む。会話画面は外部パッケージを直接参照せず、`GenerativeConversationLoader` を介して利用する。

## アクセシビリティ

応答待機文言は polite live region で通知する。隣接する文言と通知が重複しないよう、三点 Animation は支援技術から隠す。利用者が動きを減らす設定を有効にした場合は位置移動を停止し、三点の明暗切替で処理中を示す。

会話一覧の親要素には live region を設定しない。待機状態と `TextLoader` が個別に通知を所有し、失敗表示は `role="alert"`、利用者による停止表示は `role="status"` で通知する。これによりストリーミング本文の重複通知を避ける。

## 変更時の検証

1. `GenerativeConversationLoader.test.tsx` で待機、全文更新、静止表示を確認する。
2. `ai-assistant-generative-loader.test.ts` で AIアシスタントの状態接続とスタイル読込を確認する。
3. Portal 全テストと production build を実行する。
4. 配信後の AIアシスタントで待機、ストリーミング、完了表示を確認する。
5. ブラウザ Console の error を確認し、画面をスクリーンショットとして保存する。
6. 実 Task の `task.cancelled` 後に Loader、工程表示及び失敗 Alert が残らないことを確認する。
7. Cancelled Session の再読込後に中立的な停止状態を復元し、Streaming Loader を再生成しないことを確認する。
