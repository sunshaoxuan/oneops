# AI アシスタント要件

更新日: 2026-07-29

## 1. 機能境界

AI アシスタントは OneOps 全体から利用できる独立した共通機能とする。問合せ支援の AI 補助は Model API を固定利用し、AI アシスタントは CAG を Agent Gateway 経由で利用する。両機能の設定、会話、履歴、監査を混在させない。

AI アシスタントは Skill、ツール、コード、ナレッジ、複数資料、多段階調査を扱う会話用途とする。問合せ支援内の顧客向け返信案作成は対象外とする。

## 2. 表示と操作

1. `ai.assistant.use` 権限を持つログインユーザーの全画面にチャットアイコンを常時表示する。
2. アイコンは画面右下に固定し、ページ遷移、再読込、履歴戻りでも現在の AI Session を維持する。
3. アイコンを選択すると右下にチャットウィンドウを表示する。ウィンドウは OneOps の主コンテンツより前面に配置し、モーダル背景を使用しない。
4. デスクトップでは幅 420 ピクセル、高さは最大 680 ピクセルを基準とし、画面内に収める。狭い画面では全画面表示に切り替える。
5. ヘッダーには現在の Session 名、新規話題、履歴、最小化、閉じる操作を配置する。
6. 最小化と閉じる操作は Session を終了させない。再度開いた時は同じ Session と表示位置を復元する。
7. 会話表示は簡潔な ChatGPT 形式とし、ユーザー発言、AI 発言、実行中表示、失敗表示を明確に分ける。
8. AI 応答は生成中の文字列を逐次表示する。完了後にまとめて表示する方式は採用しない。
9. 送信中でも現在の応答を停止できる。停止時は上流 Task の取消可否と実際の停止結果を表示する。

## 3. AI Session

本書の AI Session は AI アシスタントの話題単位であり、ログイン認証 Session とは別の業務エンティティとする。

1. 各 AI Session は OneOps が生成する独立した安定物理 ID `assistantSessionId` を持つ。
2. 各 AI Session は所有者である OneOps ユーザー物理 ID を外部キーとして保持する。
3. 1 人の OneOps ユーザーは複数の AI Session を所有できる。
4. 各 AI Session は 1 つの Agent Gateway 設定、Project、CAG Conversation ID に対応する。
5. OneOps の `assistantSessionId` を公開 API の主識別子とし、CAG Conversation ID をブラウザーの主識別子にしない。
6. 新規話題を選択した時点で OneOps の AI Session を作成する。CAG Conversation は最初の発言送信時に作成し、空の話題を作成しても上流リソースを増やさない。
7. Session 名は最初のユーザー発言から自動生成でき、利用者が変更できる。
8. Session は `ACTIVE`、`ARCHIVED`、`FAILED` の状態を持つ。削除は別途明示操作とし、通常の履歴整理は `ARCHIVED` を使用する。
9. 利用者は自分が所有する Session だけを一覧、表示、更新、アーカイブできる。管理者による閲覧は専用監査権限と監査記録を必須とする。
10. Session 一覧は更新日時の新しい順とし、タイトル、最終発言時刻、状態を表示する。

## 4. メッセージと履歴

1. 各メッセージは独立した安定物理 ID を持ち、`assistantSessionId` を外部キーとして保持する。
2. メッセージ種別は `USER`、`ASSISTANT`、`SYSTEM` とする。
3. OneOps はユーザー発言と確定した AI 発言を正規化して保存する。
4. CAG Task ID、CAG Event ID、Task sequence、Conversation global sequence を追跡情報として保存する。
5. 受信途中の delta は同じ AI メッセージへ順序どおりに反映する。完了イベント受信後に確定状態へ変更する。
6. 同じ Event ID または同じ sequence を再受信してもメッセージ本文を重複追加しない。
7. 画面再読込時は OneOps に保存した履歴を先に表示し、未完了 Task がある場合だけ保存済み cursor から SSE を再開する。
8. CAG の会話取得 API は整合性確認と障害回復に使用する。ユーザーの Session 一覧は OneOps の所有関係から取得する。
9. Session ごとに独立した履歴、入力欄、未完了 Task、SSE cursor を持つ。Session 切替時に別 Session の応答を混在させない。

## 5. CAG と SSE

AI アシスタントを利用可能にする前に、管理者向け完全接続テストで次を確認する。

1. 設定済み Project が `/projects` に存在する。
2. 選択した実行 Profile が Project で許可されている。
3. Conversation と Task を作成できる。
4. Task イベントが `text/event-stream` で返り、`id`、`event`、`data` を保持する。
5. `agent.message.started`、`agent.message.delta`、`agent.message` を解析できる。
6. 現行 CAG の `agent.message.delta.data.delta` と `agent.message.data.text` を表示へ変換できる。
7. `task.completed`、`task.failed`、`task.cancelled` を終端として認識できる。
8. `after_sequence` で再開し、Event ID と sequence で重複を排除できる。
9. SSE を逐次解析し、終端までの全イベントをメモリへ保持しない。
10. ブラウザー切断、再接続、上流切断、取消、最大イベントサイズを制御できる。

Task SSE の再開位置は `after_sequence` を正とする。現行 CAG の Task SSE が `Last-Event-ID` を処理しない間は、OneOps が最後に確定した sequence を保存し、再接続 URL の `after_sequence` を更新する。

## 6. システム設定

システム管理者は AI アシスタント用として次を設定する。

1. 利用する Agent Gateway 設定 ID
2. Project ID
3. 実行 Profile
4. 有効状態
5. Session とメッセージの保持期間

AI アシスタントはこの設定を固定利用する。一般ユーザーに Agent Gateway、Project、Profile の切替操作を表示しない。設定変更後も既存 Session は作成時の Gateway と Project を保持し、履歴の参照可能性を維持する。

## 7. セキュリティと監査

1. ブラウザーは Agent Gateway の Access Token を保持しない。
2. Session とメッセージの API は認証ユーザー物理 ID による所有者条件を必須とする。
3. ユーザー入力を信頼できない内容として扱い、入力内の命令で OneOps のシステム指示を変更させない。
4. パスワード、Cookie、CSRF Token、保存済み Secret を CAG へ送信しない。
5. Session 作成、表示、名称変更、アーカイブ、発言送信、Task 開始、停止、完了、失敗、SSE 再接続を操作監査へ記録する。
6. 監査には OneOps ユーザー物理 ID、`assistantSessionId`、Gateway、Project、Profile、Task ID、結果、所要時間を含める。
7. CAG が Token 使用量を返す場合は入力、出力、合計を保存する。未提供の場合は未提供状態を保存する。

## 8. 公開 API

1. `GET /api/work-center/v1/ai-assistant/sessions`
2. `POST /api/work-center/v1/ai-assistant/sessions`
3. `GET /api/work-center/v1/ai-assistant/sessions/{assistantSessionId}`
4. `PATCH /api/work-center/v1/ai-assistant/sessions/{assistantSessionId}`
5. `POST /api/work-center/v1/ai-assistant/sessions/{assistantSessionId}/archive`
6. `POST /api/work-center/v1/ai-assistant/sessions/{assistantSessionId}/messages`
7. `GET /api/work-center/v1/ai-assistant/sessions/{assistantSessionId}/events`
8. `POST /api/work-center/v1/ai-assistant/sessions/{assistantSessionId}/tasks/{taskId}/cancel`

## 9. 受入条件

1. 権限を持つユーザーの全画面にチャットアイコンが表示され、ページ遷移後も現在の Session を維持する。
2. チャットウィンドウが右下の前面へ表示され、主画面の操作を不要に遮断しない。
3. 新規話題ごとに異なる `assistantSessionId` が作成される。
4. 同一ユーザーが複数 Session を所有し、Session ごとの履歴を切り替えられる。
5. 他ユーザーの `assistantSessionId` を指定しても一覧、詳細、SSE を取得できない。
6. CAG の delta が逐次表示され、完了後の本文と一致する。
7. 再接続時に保存済み sequence から再開し、文字列を重複表示しない。
8. Session を切り替えても Task、メッセージ、cursor が混在しない。
9. 新規話題、名称変更、アーカイブ、停止、履歴復元を確認できる。
10. 問合せ AI 補助が引き続き Model API だけを使用する。
11. 操作監査でユーザー、Session、Task、Gateway、Project、Profile、結果を追跡できる。
12. 単体テスト、本番ビルド、ブラウザー表示、コンソール、SSE 再接続、権限分離を検証する。
