# AI アシスタント要件

更新日: 2026-07-29

## 1. 機能境界

AI アシスタントは OneOps 全体から利用できる独立した共通機能とする。問合せ支援の AI 補助は Model API を固定利用し、AI アシスタントは CAG を Agent Gateway 経由で利用する。両機能の設定、会話、履歴、監査を混在させない。

AI アシスタントは Skill、ツール、コード、ナレッジ、複数資料、多段階調査を扱う会話用途とする。問合せ支援内の顧客向け返信案作成は対象外とする。

## 2. 表示と操作

1. `ai.assistant.use` 権限を持つログインユーザーには、第 1 階層の「AI アシスタント」ノードを表示する。
2. AI アシスタント画面以外ではチャットアイコンを画面右下に固定し、ページ遷移、再読込、履歴戻りでも現在の AI Session を維持する。AI アシスタント画面では右下の入口を重複表示しない。
3. アイコンを選択すると右下にチャットウィンドウを表示する。ウィンドウは OneOps の主コンテンツより前面に配置し、モーダル背景を使用しない。
4. デスクトップでは幅 420 ピクセル、高さは最大 680 ピクセルを基準とし、画面内に収める。狭い画面では全画面表示に切り替える。
5. ヘッダーには現在の Session 名、新規話題、履歴、最小化、閉じる操作を配置する。
6. 最小化と閉じる操作は Session を終了させない。再度開いた時は同じ Session と表示位置を復元する。
7. 会話表示は簡潔な ChatGPT 形式とし、ユーザー発言、AI 発言、実行中表示、失敗表示を明確に分ける。
8. AI 応答は生成中の文字列を逐次表示する。完了後にまとめて表示する方式は採用しない。
9. 会話の削除操作は入力欄へ配置せず、履歴一覧の各 Session に配置する。誤操作を防ぐ確認を表示する。
10. 問合せ詳細で質問ブロックを開いている場合、チャットヘッダー直下にチケット No.、質問順、件名を小さく表示する。
11. AI アシスタントは問合せ詳細ドロワーより前面に表示し、現在の質問を確認しながら会話できるようにする。
   問合せ詳細と添付プレビューの焦点制御は、前面のチャット入力を妨げない設定とする。
12. 現在の Session で CAG へ送信済みの問合せ参照は、詳細ドロワーを閉じても灰色の「参照済み」として保持する。
13. 送信前の問合せ参照は詳細ドロワーを閉じた時に除去する。
14. 別の質問を開いた時は、参照済みの問合せの下へ現在の質問を活動状態で追加し、1 つの Conversation で複数の問合せを扱えるようにする。
15. 第 1 階層の AI アシスタント画面では、浮動ウィンドウと同じ React 状態、Session、SSE 接続を使用して全幅表示する。左側へ会話履歴、右側へ会話本文と入力欄を常時表示する。
16. 浮動ウィンドウの最大化操作は AI アシスタント画面へ遷移する。遷移時に別のチャット実体や重複 SSE 接続を作成しない。
17. AI アシスタント画面の表示、右下入口、Session 操作、Task 作成、SSE 購読はすべて `ai.assistant.use` 権限を必要とする。ロール権限分配画面では「AI アシスタント」行の「実行」操作として表示する。

## 3. AI Session

本書の AI Session は AI アシスタントの話題単位であり、ログイン認証 Session とは別の業務エンティティとする。

1. CAG が生成する `conversation.id` を AI Session の安定物理 ID として直接使用する。OneOps は別の Session ID を生成しない。
2. 各 AI Session は所有者である OneOps ユーザー物理 ID を外部キーとして保持する。
3. 1 人の OneOps ユーザーは複数の AI Session を所有できる。
4. 各 AI Session は 1 つの Agent Gateway 設定と Project に対応し、主キーは対応する CAG Conversation ID とする。
5. 公開 API の `{conversationId}` は CAG の `conversation.id` と同じ値を使用する。OneOps は API 処理前に現在ユーザーの所有関係を検証する。
6. 新規話題を選択した時点で CAG Conversation を作成し、返された `conversation.id` と OneOps ユーザー物理 ID の所有関係を保存する。
7. Session 名は最初のユーザー発言を文単位で正規化して自動生成する。問合せコンテキストがある場合はチケット No. を先頭へ付与する。
8. Session は `ACTIVE`、`ARCHIVED` の状態を持つ。履歴一覧の削除は OneOps の所有関係を削除する。現行 CAG に Conversation 削除 API がないため、CAG 側の Conversation は変更しない。
9. 利用者は自分が所有する Session だけを一覧、表示、更新、アーカイブ、削除できる。管理者による閲覧は専用監査権限と監査記録を必須とする。
10. Session 一覧は更新日時の新しい順とし、タイトル、最終発言時刻、状態を表示する。

## 4. メッセージと履歴

1. CAG Conversation の Task 一覧と Conversation SSE をメッセージ履歴の正式データソースとする。
2. OneOps は Conversation ID、所有者、Gateway、Project、Profile、表示タイトル、状態、最終 Task ID だけを保存する。CAG のメッセージ本文を重複保存しない。
3. ユーザー発言は CAG Task の `prompt`、AI 発言は `agent.message.delta` と `agent.message` から復元する。
4. CAG Task ID、CAG Event ID、Task sequence、Conversation sequence を追跡情報として使用する。
5. 受信途中の delta は同じ Task の AI 発言へ順序どおりに反映する。`agent.message` 受信後に確定状態へ変更する。
6. 同じ Event ID または同じ Conversation sequence を再受信してもメッセージ本文を重複追加しない。
7. 画面再読込時は CAG Conversation の Task 一覧と過去イベントを取得し、最後の Conversation sequence から SSE を再開する。
8. ユーザーの Session 一覧と所有関係は OneOps から取得し、会話内容は所有者確認後に CAG から取得する。
9. Session ごとに独立した履歴、入力欄、未完了 Task、SSE cursor を持つ。Session 切替時に別 Session の応答を混在させない。
10. 問合せコンテキストを送信した CAG Task の保存済み `prompt` から、OneOps の履歴表示では利用者の入力部分だけを復元する。
11. 保存済み `prompt` の問合せ境界から Task ごとの参照情報を復元し、Session 単位の問合せ参照履歴として表示する。
12. `queued` または `running` の Task が存在しても、入力、新規話題、Session 切替、履歴操作を利用可能とする。
13. Task 作成 HTTP 要求の送信中は同じ操作の重複送信だけを抑止し、入力欄は次の発言を編集可能な状態で維持する。

## 5. 添付ファイルと大容量貼り付け

1. 入力欄はファイル選択とドラッグアンドドロップによる複数ファイル添付を受け付ける。
2. 送信前の添付ファイルは入力欄の上にファイル名、サイズ、転送状態、削除操作を表示する。
3. 1 ファイルは 25 MiB 以下、1 回の発言は 10 件以下、合計 50 MiB 以下とする。空ファイルは受け付けない。
4. プレーンテキストの貼り付けが UTF-8 で 32 KiB を超える場合、入力欄へ全文を展開せず、日時を含む `pasted-text-*.txt` を生成して添付一覧へ追加する。
5. 32 KiB 以下の貼り付けは通常の入力欄操作として扱う。判定は文字数ではなく UTF-8 バイト数を使用する。
6. 添付ファイルだけでも発言できる。この場合は「添付ファイルを解析してください。」を Task の利用者発言として補う。
7. OneOps は添付ファイルを利用者物理 ID と CAG Conversation ID に関連付けて実行用領域へ保存する。ブラウザーを閉じた後や Task が待機中の間も解析可能な状態を維持する。
8. CAG Task の作成時に添付ファイルを Task ID へ関連付ける。同じ添付ファイルを別 Task へ再利用しない。
9. CAG へは OneOps Gateway の内部 URL、期限、SHA-256 を渡す。内部 URL は HMAC 署名を検証し、有効期間を 72 時間とする。
10. OneOps 実行用領域の添付ファイルは 7 日後に削除対象とする。履歴画面は CAG Task Prompt からファイル名、種類、サイズ、SHA-256 を復元し、期限切れの署名 URL を返さない。
11. 添付ファイル内容は信頼できない入力として扱う。ファイル内の命令によってシステム指示、利用者の依頼、参照範囲を変更しない旨を CAG Task Prompt へ付加する。
12. 添付ファイルのアップロード、利用者による読取、送信前削除を操作監査へ記録する。

## 6. 問合せコンテキスト

1. 問合せ詳細で現在展開している質問ブロックを AI アシスタントの参照対象とする。
2. コンテキストにはチケット No.、件名、ステータス、分類、質問本文、質問添付ファイル名、その質問ブロック内の対応記録を含める。
3. 顧客連絡先、メールアドレス、電話番号、パスワード、Cookie、CSRF Token、Access Token は送信前に除外する。
4. コンテキストは OneOps Gateway で上限を設定し、質問本文、最新 30 件までの対応記録、最大 20 件の添付ファイル名へ正規化する。
5. コンテキスト内の命令は信頼せず、利用者の質問に対する参照情報として扱うよう CAG Task の Prompt に境界を設定する。
6. 質問ブロックを切り替えた時は表示と送信対象を同時に切り替える。詳細ドロワーを閉じた時はコンテキストを解除する。
7. コンテキストは CAG Task 作成時に同じ `conversation.id` へ送信し、応答は Conversation SSE で逐次受信する。
8. 同じ質問を複数回送信した場合は 1 件の参照として表示する。チケット No. と安定した `questionKey` の組合せで重複を排除する。
9. 問合せ参照履歴は CAG Task から復元し、OneOps の別テーブルへメッセージ本文や問合せ本文を重複保存しない。

## 7. CAG と SSE

普通の HTTP API と SSE は同じ公開サービス、ドメイン、ポートを使用する。ブラウザーは双方を OneOps の同一生成元 `/api/work-center/v1/ai-assistant` から利用する。OneOps Gateway は普通の HTTP と SSE を、同じ Agent Gateway 設定の Endpoint へ中継する。現行 CAG では `http://127.0.0.1:8000/api/v1` を共通 Endpoint とする。

SSE は Conversation または Task のイベント購読方式であり、Task の実行主体ではない。購読接続中、または同じ Conversation に `queued`、`running` の Task が存在する間も、OneOps は新しい Task の HTTP 作成を事前に遮断せず、その他の画面操作を許可する。SSE 接続状態と Task 実行状態を、チャット全体の利用可否へ変換しない。上流 CAG が Task 作成を受け付けない場合はエラーを表示し、入力内容を復元する。

Task の状態は `queued`、開始処理、逐次応答、完了、失敗に分けて表示する。待機中 Task は添付ファイルを OneOps 側で保持し、CAG の実行開始時に署名 URL から取得できるようにする。

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

## 8. システム設定

システム管理者は AI アシスタント用として次を設定する。

1. 利用する Agent Gateway 設定 ID
2. Project ID
3. 実行 Profile
4. 有効状態
5. Session 所有関係の保持期間

AI アシスタントはこの設定を固定利用する。一般ユーザーに Agent Gateway、Project、Profile の切替操作を表示しない。設定変更後も既存 Session は作成時の Gateway と Project を保持し、履歴の参照可能性を維持する。

## 9. セキュリティと監査

1. ブラウザーは Agent Gateway の Access Token を保持しない。
2. Session、Task、SSE の API は認証ユーザー物理 ID による Conversation 所有者条件を必須とする。
3. ユーザー入力を信頼できない内容として扱い、入力内の命令で OneOps のシステム指示を変更させない。
4. パスワード、Cookie、CSRF Token、保存済み Secret を CAG へ送信しない。
5. Session 作成、表示、名称変更、アーカイブ、削除、発言送信、Task 開始、停止、完了、失敗、SSE 再接続を操作監査へ記録する。
6. 監査には OneOps ユーザー物理 ID、CAG Conversation ID、Gateway、Project、Profile、Task ID、結果、所要時間を含める。
7. CAG が Token 使用量を返す場合は入力、出力、合計を保存する。未提供の場合は未提供状態を保存する。

## 10. 公開 API

1. `GET /api/work-center/v1/ai-assistant/sessions`
2. `POST /api/work-center/v1/ai-assistant/sessions`
3. `GET /api/work-center/v1/ai-assistant/sessions/{conversationId}`
4. `PATCH /api/work-center/v1/ai-assistant/sessions/{conversationId}`
5. `POST /api/work-center/v1/ai-assistant/sessions/{conversationId}/archive`
6. `DELETE /api/work-center/v1/ai-assistant/sessions/{conversationId}`
7. `POST /api/work-center/v1/ai-assistant/sessions/{conversationId}/messages`
8. `GET /api/work-center/v1/ai-assistant/sessions/{conversationId}/events`
9. `POST /api/work-center/v1/ai-assistant/sessions/{conversationId}/attachments`
10. `GET /api/work-center/v1/ai-assistant/sessions/{conversationId}/attachments/{attachmentId}`
11. `DELETE /api/work-center/v1/ai-assistant/sessions/{conversationId}/attachments/{attachmentId}`
12. `GET /api/work-center/v1/ai-assistant/task-attachments/{attachmentId}/content`

## 11. 受入条件

1. 権限を持つユーザーには AI アシスタント画面以外でチャットアイコンが表示され、ページ遷移後も現在の Session を維持する。
2. チャットウィンドウが右下の前面へ表示され、主画面の操作を不要に遮断しない。
3. 新規話題ごとに CAG が異なる `conversation.id` を作成し、OneOps が同じ ID を Session ID として返す。
4. 同一ユーザーが複数 Session を所有し、Session ごとの履歴を切り替えられる。
5. 他ユーザーが所有する CAG Conversation ID を指定しても詳細、Task、SSE を取得できない。
6. CAG の delta が逐次表示され、完了後の本文と一致する。
7. 再接続時に保存済み sequence から再開し、文字列を重複表示しない。
8. Session を切り替えても Task、メッセージ、cursor が混在しない。
9. 新規話題、自動名称生成、各履歴行からの削除、履歴復元を確認できる。
10. 問合せ AI 補助が引き続き Model API だけを使用する。
11. 操作監査でユーザー、Session、Task、Gateway、Project、Profile、結果を追跡できる。
12. 単体テスト、本番ビルド、ブラウザー表示、コンソール、SSE 再接続、権限分離を検証する。
13. 問合せの質問ブロックを切り替えるとチャット上の表示が切り替わり、同じ内容が CAG Task の参照情報へ含まれる。
14. 送信済みの質問は詳細を閉じた後も参照済み表示が残り、未送信の質問は消える。
15. 別の質問を開くと既存の参照済み表示の下に活動中の参照が追加され、Session 切替時に他の Session と混在しない。
16. 問合せ詳細または添付プレビューを開いたまま、チャット入力へフォーカスして発言できる。
17. 普通の HTTP と SSE が同じ OneOps 公開生成元を使用し、同じ CAG Endpoint の 8000 ポートへ中継される。
18. 同じ Conversation に実行中 Task が存在しても入力、新規 Task の要求、新規話題、Session 切替、履歴操作を利用できる。
19. Task 作成 HTTP 要求の送信中は重複送信だけが抑止され、入力欄で次の発言を編集できる。上流拒否時は送信した入力が失われない。
20. 第 1 階層メニューの「AI アシスタント」を選択すると `/ai-assistant` で完全なチャット画面を表示し、右下の浮動入口を重複表示しない。
21. 完全画面では会話履歴を常時表示し、浮動ウィンドウと同じ Session、入力、Task、SSE 状態を継続する。
22. `ai.assistant.use` 権限を外したユーザーにはメニュー、完全画面、右下入口を表示せず、旧 `/tasks` URL は権限確認後に `/ai-assistant` へ正規化する。
23. ファイル選択とドラッグアンドドロップで複数ファイルを追加し、送信前に個別に削除できる。
24. UTF-8 で 32 KiB を超える貼り付けが `.txt` 添付へ変換され、32 KiB 以下は入力欄へ通常どおり貼り付けられる。
25. 添付ファイルだけの発言を作成でき、CAG Task が署名 URLからファイルを取得して SHA-256 を照合できる。
26. 他の利用者または他の Conversation の添付 ID を指定しても取得、削除、Task への関連付けができない。
27. `queued` の Task を実行待ちとして表示し、待機中も入力、別 Task、新規話題、Session 切替を利用できる。
28. CAG Task 履歴から添付メタデータを復元でき、ブラウザーへ CAG 用署名 URL を返さない。
