# AI 会話ローダー工程インターフェース

## 目的

AIアシスタントの応答待機とストリーミング受信を、一つの再利用可能な表示インターフェースで扱う。表示層は CAG の会話 ID、タスク ID、SSE 接続管理を所有しない。会話状態と受信済み全文だけを入力として受け取る。

## 公開インターフェース

`GenerativeConversationLoader` は次の値を受け取る。

| 項目 | 型 | 意味 |
| --- | --- | --- |
| `phase` | `QUEUED`、`RUNNING`、`STREAMING` | 現在の会話生成段階 |
| `receivedText` | `string` | 現時点までに受信した応答全文 |
| `statusLabel` | `string` | 応答本文が未着のときに表示するローカライズ済み状態文言 |
| `className` | `string` | 呼出元が指定する任意の配置用クラス |

`receivedText` が空の場合は `InlineLoader` の `signal` を装飾として表示し、外側の `role="status"` と `aria-live="polite"` が状態文言を通知する。

`receivedText` が存在する場合は `TextLoader` の `cascade` へ受信済み全文を渡す。`STREAMING` の間だけ新規接尾部をアニメーションし、それ以外の段階では静止表示する。

## 会話状態との対応

| CAG イベントまたは状態 | 工程段階 | 表示 |
| --- | --- | --- |
| `task.created`、`task.queued` | `QUEUED` | AI の応答待ち文言とインラインローダー |
| `task.started`、ワークスペース準備、ランタイム接続 | `RUNNING` | 準備中文言とインラインローダー |
| `agent.message.delta` | `STREAMING` | 現時点までの応答全文と接尾部アニメーション |
| `agent.message`、`task.completed` | 完了表示 | 既存の Markdown 表示 |
| `task.failed`、`task.cancelled` | エラー表示 | 既存のエラー表示 |

## 依存関係

外部パッケージ `generative-loaders` は `0.1.1` に固定する。React 18 以上と Node 20 以上が必要で、OneOps の React 19 と Node 24 の範囲内である。ライセンスは MIT である。

外部スタイルは `main.tsx` で一度だけ読み込む。会話画面は外部パッケージを直接参照せず、`GenerativeConversationLoader` を介して利用する。

## アクセシビリティ

応答待機文言は polite live region で通知する。隣接する文言と通知が重複しないよう、インラインアニメーション自身は支援技術から隠す。外部ライブラリの reduced motion 対応を保持し、利用者が動きを減らす設定を有効にした場合は静止状態を表示する。

会話一覧の親要素には live region を設定しない。待機状態と `TextLoader` が個別に通知を所有し、失敗表示は `role="alert"` で通知する。これによりストリーミング本文の重複通知を避ける。

## 変更時の検証

1. `GenerativeConversationLoader.test.tsx` で待機、全文更新、静止表示を確認する。
2. `ai-assistant-generative-loader.test.ts` で AIアシスタントの状態接続とスタイル読込を確認する。
3. Portal 全テストと production build を実行する。
4. 配信後の AIアシスタントで待機、ストリーミング、完了表示を確認する。
5. ブラウザ Console の error を確認し、画面をスクリーンショットとして保存する。
