# AI アシスタント HTTP、SSE、Task 実行状態の調査報告

## 1. 調査目的

CAG の普通の HTTP、SSE、Task 実行状態の関係を確認し、実行中 Task が OneOps のチャット操作を遮断する原因を修正する。

## 2. 確認結果

### 2.1 公開サービス

ブラウザーは普通の HTTP と SSE の双方を OneOps の同一生成元 `/api/work-center/v1/ai-assistant/sessions/{conversationId}` から利用する。

1. Task 作成は `POST .../messages`
2. SSE 購読は `GET .../events`

OneOps Gateway は保存済みの同一 `gateway.endpoint` を使用する。

1. JSON は `${gateway.endpoint}${path}`
2. SSE は `${settings.endpoint}${upstreamPath}`

稼働中 CAG 0.12.0 の OpenAPI は 8000 ポートで `/api/v1/tasks`、`/api/v1/tasks/{task_id}/events`、`/api/v1/conversations/{conversation_id}/events` を公開している。

### 2.2 画面が利用不可になる原因

`AiAssistantChat.tsx` は Conversation 内に `queued` または `running` の Task が 1 件でも存在すると `busy=true` としていた。`busy` は入力欄と送信ボタンを無効化し、送信処理も中断していた。

SSE 接続状態は Task のイベント購読状態であり、この全体門扉を必要としない。OneOps Gateway にも実行中 Task を理由とした事前拒否は存在しない。

### 2.3 現行 CAG の制約

`D:\workspace\cag\backend\app\services\task_service.py` の現行ソースは、同じ Conversation に非終端 Task が存在する場合に `ConversationBusyError` を発生させる。API はこれを HTTP 409 として返す。

本変更では CAG のソースとプロセスを変更しない。OneOps は Task 状態による事前遮断を廃止して上流へ要求し、上流が拒否した場合はエラーを表示して入力内容を復元する。

## 3. 修正内容

1. Conversation 全体の `busy` 判定を削除した。
2. 実行中 Task が存在しても入力欄を有効にした。
3. Task 作成 HTTP 要求の送信中だけ、同じ送信操作の重複実行を抑止する。
4. HTTP 要求中も入力欄で次の発言を編集できる。
5. 上流拒否時は、利用者が次の入力を始めていない場合に送信内容を入力欄へ復元する。
6. 新規話題、Session 切替、履歴操作は Task 状態に依存させない。

## 4. 変更境界

1. OneOps のフロントエンド、テスト、要件文書だけを変更する。
2. CAG のコード、設定、8000 ポートのプロセスを変更しない。
3. OneOps の公開ドメインとポートを追加しない。

## 5. 検証結果

1. 完全な自動テスト、運用テスト、Production build が成功した。
2. Portal の公開、nginx 設定検査、Gateway health、HTTPS 応答を確認した。
3. 認証後ブラウザーで AI アシスタント入力欄が利用可能であることを確認した。
4. 問合せ詳細の顧客質問とサポート返信に、それぞれ目的別の AI 入口があることを確認した。
5. ブラウザーコンソールの error、warning は 0 件だった。
6. CAG 8000 プロセスは公開前後で同一 PID のまま継続した。
