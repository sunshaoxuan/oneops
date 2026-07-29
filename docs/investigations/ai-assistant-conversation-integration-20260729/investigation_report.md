# AI アシスタント Conversation 連携調査

## 目的

CAG の `conversation.id` を OneOps AI アシスタントの Session ID として直接使用し、OneOps ユーザーごとに複数 Conversation の所有関係を管理する。

## CAG の確認結果

`D:\workspace\cag` は参照だけを行った。CAG のコード、設定、DB、プロセスを変更していない。

CAG の `Conversation` は物理 ID を持ち、Conversation 作成 API は `id`、Project、タイトル、Codex Thread ID、作成日時を返す。Task 作成 API は任意の `conversation_id` を受け取り、Conversation が存在しない場合と実行中 Task が存在する場合を明示的に拒否する。

Conversation SSE は Conversation 単位の sequence を使用する。`after_sequence` と `Last-Event-ID` の大きい値から再開し、同じ Conversation に属する複数 Task のイベントを順序どおりに返す。

## OneOps の実装

1. `POST /ai-assistant/sessions` が CAG Conversation を作成する。
2. CAG が返した `conversation.id` を `ai_assistant_sessions.conversation_id` の主キーへそのまま保存する。
3. OneOps はユーザー物理 ID、Gateway 設定 ID、Project、Profile、表示タイトル、状態、最終 Task ID を保存する。
4. OneOps は CAG メッセージ本文を重複保存しない。
5. Session 一覧は OneOps の所有関係から取得する。
6. Session 詳細は所有者確認後に CAG Conversation と Task 一覧から取得する。
7. メッセージ送信は所有者確認後に同じ `conversation.id` を CAG Task へ渡す。
8. SSE は所有者確認後に CAG Conversation SSE を同一生成元で配信する。

## 会話 UI と問合せコンテキスト

1. 会話の削除は入力欄から除外し、履歴一覧の各 Session 行へ確認付きで配置した。
2. 削除時は現在ユーザーと `conversation.id` の所有関係を OneOps から削除する。
3. 現行 CAG の Conversation API に削除 API はないため、CAG の Conversation、Task、Event は変更しない。
4. 最初の発言を文単位で正規化し、問合せ詳細を参照中の場合はチケット No. を付けて Session 表示名を生成する。
5. 問合せ詳細で展開している質問を、チケット No.、質問順、件名とともにチャットへ表示する。
6. 質問本文、対応記録、添付ファイル名を OneOps Gateway で正規化し、同じ `conversation.id` の CAG Task Prompt へ参照情報として含める。
7. メールアドレス、電話番号、パスワード、Cookie、CSRF Token、Access Token は Gateway で除外する。
8. CAG の保存済み Task Prompt は参照情報を含む。OneOps の履歴表示では利用者が入力した部分だけを復元する。
9. 保存済み Task Prompt の参照情報を復元し、同じ `conversation.id` で使用済みの質問を Session 単位の参照履歴として表示する。
10. 使用済みの質問は詳細終了後に灰色で保持する。未送信の活動中質問は詳細終了時に除去する。
11. 別の質問を開いた場合は既存の使用済み参照の下へ追加し、チケット No. と `questionKey` で重複を排除する。

## セキュリティ境界

`ai.assistant.use` 権限を持つ利用者だけが AI アシスタント API と全体チャット入口を利用できる。初期 Migration は `SYSTEM_ADMIN`、`OPERATOR`、`VIEWER` へ権限を付与する。管理者は既存のロール管理で権限を変更できる。

Conversation ID を知っていても、OneOps の所有関係が現在ユーザーと一致しなければ詳細、Task、SSE を取得できない。Agent Gateway Access Token は OneOps Gateway だけが復号し、ブラウザーへ返さない。

## CAG 実行プロセス

公開後も CAG の主実行サービスは OpenAPI 0.12.0、ポート 8000、PID 17348 のままである。OneOps の公開は OneOps Gateway だけを再起動し、CAG の実行中知識学習へ操作を行っていない。
