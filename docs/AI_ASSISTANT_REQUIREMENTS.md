# AIアシスタント要件

更新日: 2026-08-10

## 1. 機能境界

AIアシスタントは OneOps 全体から利用できる独立した共通機能とする。問合せ支援の AI 補助は Model API を固定利用し、AIアシスタントは CAG を Agent Gateway 経由で利用する。両機能の設定、会話、履歴、監査を混在させない。

AIアシスタントは Skill、ツール、コード、ナレッジ、複数資料、多段階調査を扱う会話用途とする。問合せ支援内の顧客向け返信案作成は対象外とする。

## 2. 表示と操作

1. `ai.assistant.use` 権限を持つログインユーザーには、第 1 階層の「AIアシスタント」ノードを表示する。
2. AIアシスタント画面以外ではチャットアイコンを画面右下に固定し、ページ遷移、再読込、履歴戻りでも現在の AI Session を維持する。AIアシスタント画面では右下の入口を重複表示しない。
3. アイコンを選択すると右下にチャットウィンドウを表示する。ウィンドウは OneOps の主コンテンツより前面に配置し、モーダル背景を使用しない。
4. デスクトップでは幅 420 ピクセル、高さは最大 680 ピクセルを基準とし、画面内に収める。狭い画面では全画面表示に切り替える。
5. ヘッダーには現在の Session 名、新規話題、履歴、最大化、閉じる操作を配置する。
6. 閉じる操作は Session を終了させない。再度開いた時は同じ Session と表示位置を復元する。
7. 会話表示は簡潔な ChatGPT 形式とし、ユーザー発言、AI 発言、実行中表示、失敗表示を明確に分ける。
8. AI 応答は生成中の文字列を逐次表示する。完了後にまとめて表示する方式は採用しない。
9. 会話の削除操作は入力欄へ配置せず、履歴一覧の各 Session に配置する。誤操作を防ぐ確認を表示する。
10. 問合せ詳細で質問ブロックを開いている場合、チャットヘッダー直下にチケット No.、質問順、件名を小さく表示する。
11. AIアシスタントは問合せ詳細ドロワーより前面に表示し、現在の質問を確認しながら会話できるようにする。
   問合せ詳細と添付プレビューの焦点制御は、前面のチャット入力を妨げない設定とする。
12. 現在の Session で CAG へ送信済みの問合せ参照は、詳細ドロワーを閉じても灰色の「参照済み」として保持する。
13. 送信前の問合せ参照は詳細ドロワーを閉じた時に除去する。
14. 別の質問を開いた時は、参照済みの問合せの下へ現在の質問を活動状態で追加し、1 つの Conversation で複数の問合せを扱えるようにする。
15. 第 1 階層の AIアシスタント画面では、浮動ウィンドウと同じ React 状態、Session、SSE 接続を使用して全幅表示する。左側へ会話履歴、右側へ会話本文と入力欄を常時表示する。
16. 浮動ウィンドウの最大化操作は AIアシスタント画面へ遷移する。遷移時に別のチャット実体や重複 SSE 接続を作成しない。
17. AIアシスタント画面の表示、右下入口、Session 操作、Task 作成、SSE 購読はすべて `ai.assistant.use` 権限を必要とする。ロール権限分配画面では「AIアシスタント」行の「実行」操作として表示する。
18. 浮動ウィンドウと全画面の AI 応答は共通の Markdown 表示を使用する。CommonMark に加えて、表、取り消し線、タスクリスト、自動リンクを含む GitHub Flavored Markdown を解釈する。
19. 見出し、段落、箇条書き、番号付きリスト、引用、インラインコード、コードブロック、水平線、リンク、表を画面幅に合わせて表示する。表は利用可能な横幅に収めてセル内を自動改行し、会話領域全体へ横スクロールを発生させない。コードブロックは自身の領域内で横スクロールできるようにする。
20. 浮動ウィンドウと全画面の会話本文には、外枠のない固定クイックナビゲーションを表示する。各目盛りは 1 回のユーザー入力だけを表し、AI 発言用の目盛りは作らない。目盛りは長い会話にも対応できるよう中央へ密に並べ、利用可能な高さが不足する場合は間隔を圧縮する。静止時は選択済みの目盛りだけを黒く長く表示し、その他を同じ長さの短線とする。選択済みの目盛りは別の目盛りを選択するまで維持する。マウスをナビゲーション上で移動している間、またはキーボードで目盛りへフォーカスしている間だけ、対象目盛りを頂点として前後 3 件を距離に応じて段階的に短くする波形を表示する。マウスがナビゲーションを離れるかフォーカスが外れた時は波形を消す。目盛りを選択すると対応するユーザー入力を会話領域内へ表示する。目盛りのホバーまたはキーボードフォーカスでは、固定幅のプレビューにユーザー入力を太字 1 行で省略表示し、その AI 回答を最大 3 行で省略表示する。会話本文のスクロール位置から波形または選択位置を自動変更しない。
21. 生成途中の応答も受信済み本文を Markdown として再評価し、SSE の delta に Markdown 記号をそのまま残さない。構文が未完了の間も入力と他の画面操作を妨げない。
22. AI 応答内の生 HTML は解釈しない。危険な URL スキームを無効化し、外部リンクは別画面で安全に開く。外部画像は自動取得せず、代替テキストだけを表示する。
23. 問合せ参照の `questionKey`、`questionThreads`、`customerEvaluation`、`messageKey` などは内部データ契約として保持し、AI 応答へ内部項目名または内部 ID を表示させない。分析対象は「第 5 回の追加質問」のような業務表現で示す。
24. 各問合せ参照の末尾に「問合せを開く」アイコン操作を配置する。選択すると問合支援へ遷移し、検索を要求せず該当チケットの詳細ドロワーを取得して、参照の `questionKey` に対応する質問ブロックを展開する。
25. 浮動ウィンドウ内の Tooltip と確認ポップアップは、浮動ウィンドウより高い前景層へ表示する。右端の「問合せを開く」操作の Tooltip は左方向へ展開し、ウィンドウ背面または画面外へ隠れないようにする。
26. 一般利用者向けの AIアシスタント画面では、空状態、待機状態、参照情報及び機能説明を「AI」として表現し、CAG、Model API、Agent Gateway などの内部実装方式を表示しない。管理者向け接続設定、操作監査及び内部技術文書では運用上必要な実装方式を識別できる状態を維持する。
27. 空状態の短い説明文は利用可能な横幅を使用し、幅が不足する場合は行長を均衡させる。末尾の一文字又は短い句だけを次行へ孤立させない。
28. 完全画面の「新しい話題」の右側と浮動画面の新規話題操作の右側に、動的なクイックアシスタント入口を表示する。
29. クイックアシスタント入口は第 1 階層へカテゴリ、第 2 階層へ専門対話を表示し、マウス、クリック、キーボードで選択できるようにする。
30. 専門対話を選択した場合は独立した AI Session を作成し、専門対話の名称、利用目的、入力開始例を空状態と入力欄で確認できるようにする。

## 3. AI Session

本書の AI Session は AIアシスタントの話題単位であり、ログイン認証 Session とは別の業務エンティティとする。

1. CAG が生成する `conversation.id` を AI Session の安定物理 ID として直接使用する。OneOps は別の Session ID を生成しない。
2. 各 AI Session は所有者である OneOps ユーザー物理 ID を外部キーとして保持する。
3. 1 人の OneOps ユーザーは複数の AI Session を所有できる。
4. 各 AI Session は 1 つの Agent Gateway 設定と Project に対応し、主キーは対応する CAG Conversation ID とする。
5. 公開 API の `{conversationId}` は CAG の `conversation.id` と同じ値を使用する。OneOps は API 処理前に現在ユーザーの所有関係を検証する。
6. 新規話題を選択した時点で CAG Conversation を作成し、返された `conversation.id` と OneOps ユーザー物理 ID の所有関係を保存する。
7. Session 名は最初のユーザー発言と Task Routing から会話テーマを自動生成する。本文先頭の固定文字数を切り出さず、対象、作業及び方向を短い業務表現へ要約する。翻訳は原文言語、内容種別及び翻訳先言語を組み合わせ、例えば中国語画面では「日文対話を中国語へ翻訳」に相当する「日文对话翻译为中文」とする。要約、分析及び分類も「文書要約」「問合せ分析」のように対象と作業を明示する。テーマを安全に確定できない場合は利用言語に応じた「一般相談」を使用し、本文の一部と省略記号を Session 名にしない。問合せコンテキストがある場合はチケット No. を先頭へ付与する。
8. Session は `ACTIVE`、`ARCHIVED` の状態を持つ。履歴一覧の削除は OneOps の所有関係を削除する。現行 CAG に Conversation 削除 API がないため、CAG 側の Conversation は変更しない。
9. 利用者は自分が所有する Session だけを一覧、表示、更新、アーカイブ、削除できる。管理者による閲覧は専用監査権限と監査記録を必須とする。
10. Session 一覧は更新日時の新しい順とし、タイトル、最終発言時刻、状態を表示する。
11. クイックアシスタントから作成した Session は、クイックアシスタント物理 ID を外部キーとして保持する。
12. クイックアシスタントから作成した Session は、作成時の継続指示をスナップショットとして保持する。自由会話では両項目を `NULL` とする。
13. 全ての Session は作成時の開始 Model 設定物理 ID、Model ID、推理レベル、速度を表示及び監査用スナップショットとして保持する。
14. 自由会話は有効な `GENERAL` のうち `FAST` の Model を開始表示へ使用する。クイックアシスタントは自身に保存された開始設定を開始表示へ使用する。Task 実行 Model は 4.1 の Task Routing で決定する。
15. 管理者が設定を変更または無効化した後も、既存 Session の開始表示及び監査用スナップショットは変更しない。Task 実行時は現在有効な軽量 Model と汎用 Model を解決し、必要な役割が欠ける場合は設定エラーとして発言を受け付けない。

## 4. メッセージと履歴

1. CAG Conversation の Task 一覧と、実行中 Task に限定した Task SSE をメッセージ履歴の正式データソースとする。
2. OneOps は Conversation ID、所有者、Gateway、Project、Profile、表示タイトル、状態、最終 Task ID だけを保存する。CAG のメッセージ本文を重複保存しない。
3. ユーザー発言は CAG Task の `prompt` から復元する。完了済み AI 発言は `final_report.summary`、実行中 AI 発言は Task SSE の `agent.message.delta` と `agent.message` から復元する。
4. CAG Task ID、CAG Event ID と Task sequence を追跡情報として使用する。
5. 受信途中の delta は同じ Task の AI 発言へ順序どおりに反映する。`agent.message` 受信後に確定状態へ変更する。
6. 同じ Event ID または同じ Task sequence を再受信してもメッセージ本文を重複追加しない。
7. 画面再読込時は CAG Conversation の Task 一覧を一度取得し、完了済み Task は `final_report.summary` から復元する。過去の Conversation Event 全件を取得しない。未完了の最新 Task が存在する場合だけ、その Task SSE を取得済み sequence から開始する。
8. ユーザーの Session 一覧と所有関係は OneOps から取得し、会話内容は所有者確認後に CAG から取得する。
9. Session ごとに独立した履歴、入力欄、未完了 Task、SSE cursor を持つ。Session 切替時に別 Session の応答を混在させない。
10. 問合せコンテキストを送信した CAG Task の保存済み `prompt` から、OneOps の履歴表示では利用者の入力部分だけを復元する。
11. 保存済み `prompt` の問合せ境界から Task ごとの参照情報を復元し、Session 単位の問合せ参照履歴として表示する。
12. `queued` または `running` の Task が存在しても、入力、新規話題、Session 切替、履歴操作を利用可能とする。
13. Task 作成 HTTP 要求の送信中は同じ操作の重複送信だけを抑止し、入力欄は次の発言を編集可能な状態で維持する。
14. クイックアシスタントの継続指示はブラウザーから送信せず、OneOps が保存済みスナップショットを各 Task Prompt の先頭へ挿入する。
15. CAG Task の表示用 Prompt、OneOps の会話履歴及び利用者向け Session API には利用者が入力した本文と公開用のクイックアシスタント概要だけを返し、継続指示を返さない。
16. Session 詳細 API は画面が使用する Task ID、状態、表示用 Prompt、公開添付、問合せ参照、公開 Routing 状態、エラー、`final_report.summary` と日時だけを返す。Conversation の重複取得、内部監査 URL、内部 Report 項目を返さない。
17. AIアシスタント画面では Workbench 用 Dashboard Query、Dashboard SSE、接続状態カード及び個人タスク概要 Query を開始しない。画面遷移時に実行中の Dashboard Query を中断し、既存 EventSource を閉じる。
18. Dashboard の定期 GET は Workbench で有効な SSE Snapshot を未受信の場合だけ補助的に実行する。EventSource の接続成立だけでは定期 GET を停止しない。有効な Snapshot の受信後は定期 GET を停止し、15 秒間 Snapshot を受信しない場合は再開する。認証 Session の定期確認はロール権限変更を画面へ反映するため維持する。
19. Gateway は起動時に Dashboard Snapshot を一度更新する。2 秒周期の Dashboard 更新は有効な Dashboard SSE クライアントが存在する間だけ実行する。Dashboard GET は随時最新化を実行し、新しい SSE クライアントの登録直後にも最新化を開始する。
20. 組織情報ソースの定期同期は Dashboard SSE の接続状態から分離する。最後の SSE クライアントが切断された後は Builder のジョブ、端末状態及び組織一覧を 2 秒周期で取得せず、組織情報ソースは設定済み周期で同期を継続する。

### 4.1 Task Routing と会話内 Task Summary

Model の選択単位は CAG Task とする。`GENERAL` 用途の複数 Model から、`FAST` を軽量 Model、既定 Model を汎用 Modelとして解決する。

1. OneOps は各利用者入力を `TRANSLATION`、`SUMMARIZATION`、`CLASSIFICATION`、`GENERAL_ASSIST`、`COMPLEX_ANALYSIS`、`INQUIRY_ANALYSIS` 又は `AGENT_OPERATION` に分類する。
2. `TRANSLATION`、`SUMMARIZATION`、`CLASSIFICATION`、`GENERAL_ASSIST` は初回から軽量 Model を使用する。`COMPLEX_ANALYSIS`、`INQUIRY_ANALYSIS`、`AGENT_OPERATION` は初回から汎用 Model を使用する。
3. 同じ Task Fingerprint の 2 回目以降は汎用 Model へ一段階だけ昇格する。汎用 Model 到達後は同じ役割を維持する。
4. Task ごとに選択した Model 設定物理 ID、Model ID と推理レベルを `routing_context` へ保存する。Session の開始スナップショットは表示及び監査起点として維持する。
5. Task Fingerprint は Task Class、翻訳先言語、制約及び正規化した現在入力から SHA-256 で生成する。Prompt、翻訳先言語、用語又は添付が実質的に変わった場合は新しい Task として扱う。
6. 初回の明示指示から Task Class、目的要約、翻訳先言語及び制約を構造化 Task Summary として生成する。追加の Model 呼出しを分類だけのために実行しない。
7. 後続入力に新しい作業の明示がない場合は、直前の Task Summary を自動継続する。初回が翻訳である場合、後続の本文だけの入力にも翻訳先言語と書式、用語、出力条件を適用する。
8. 新しい作業が明示された場合は Task Summary を更新し、その入力から新しい Task 系列を開始する。
9. Task Summary は CAG Task Prompt の信頼済み境界へ保存する。OneOps は CAG Task 一覧から最新 Summary を復元し、メッセージ本文を別テーブルへ重複保存しない。
10. 一般利用者向け回答には Task Summary の内部項目名、Model 設定物理 ID、Gateway 設定物理 ID、Model ID、Routing 理由及び Fingerprint を表示しない。
11. CAG Task には Task Routing が決定した `model`、`effort` と構造化 `routing_context` を渡す。`routing_context.tier` は軽量を `SIMPLE`、汎用を `GENERAL` とする。CAG は Task の監査 Metadata へ保存し、同じ値を Codex app-server の Thread Resume と Turn Start に適用する。
12. 監査には Task ID、Attempt 番号、Task Fingerprint、Task Class、Model 設定物理 ID、Gateway 設定物理 ID、Routing Policy Version、Selection Reason、Latency、Token 使用量及び品質検証結果を記録可能にする。

### 4.2 CAG 可用性制御

1. CAG Conversation と Task を会話履歴、継続状態、SSE 及び監査の正式データソースとし、Model API への直接迂回を行わない。
2. Agent Gateway 設定は主 Endpoint と、同一 PostgreSQL及び Redis Queue を使用する予備 Endpoint を最大 4 件保持する。
3. `GET`、`HEAD` 及び `Idempotency-Key` を持つ `POST` だけを予備 Endpoint へ切り替える。Conversation 作成と Task 作成は安定した冪等キーを CAG へ送る。
4. 一時障害は HTTP `408`、`425`、`429`、`500`、`502`、`503`、`504` と接続障害に限定する。同じ Endpoint を同一要求内で反復せず、次の予備 Endpoint を一度ずつ使用する。
5. HTTP `400`、`422` の契約エラー、認証及び権限エラー、応答上限違反、利用者による切断は再試行しない。
6. Endpoint ごとに連続失敗を記録し、閾値到達後は 30 秒間 Circuit を開く。Circuit が開いている間は次の予備 Endpoint を使用する。
7. SSE 切替時も `task_id`、`after_sequence`、`follow` 及び利用者切断を保持する。接続成立までの Timeout と接続後の Stream 生存期間を分離し、接続成立後に JSON 用 Timeout で切断しない。
8. JSON は Endpoint ごとに 2 秒、要求全体で 5 秒を上限とする。Portal は Gateway 内の切替後に同じ Session 詳細要求を自動再試行しない。

## 5. 添付ファイルと大容量貼り付け

1. 浮動ウィンドウと全画面の入力欄は、ファイル選択、クリップボードからの画像・ファイル貼り付け、ドラッグアンドドロップによる複数ファイル添付を受け付ける。`DataTransfer.files` と file 種別の `DataTransfer.items` の両方を処理し、同じ転送内で同じ画像を重複追加しない。連続した同一貼り付けイベントに対しても、アップロード待機列の同期判定で同じ画像を 1 件に保つ。
2. 送信前の画像添付は入力欄の上に縮小画像、転送状態、削除操作を表示し、ファイル名を主要表示としない。画像以外の添付ファイルはファイル名、サイズ、転送状態、削除操作を表示する。縮小画像のアクセシビリティ名には元のファイル名を含める。
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
13. 送信後の画像添付は会話内に縮小画像として表示する。縮小画像を選択すると前景の画像プレビューを開き、閉じる操作またはプレビュー外のマスク領域の選択で閉じる。浮動ウィンドウと全画面で同じ表示と操作を提供する。

## 6. 問合せコンテキスト

1. 問合せ詳細で現在展開している質問ブロックの `questionKey` を、AIアシスタントが今回分析する対象として示す。
2. コンテキストにはチケット No.、件名、ステータス、サブステータス、担当者名、顧客組織名、分類、緊急度、問合せレベル、作成日時、更新日時、回答希望日、問合せ全体の初回質問、全追加質問、全内部記録、全顧客公開回答、各記録の可視性、問合せ全体と各記録の添付ファイル名、最終顧客評価を含める。顧客担当者名、電話番号、メールアドレスは含めない。
3. 顧客連絡先、メールアドレス、電話番号、パスワード、Cookie、CSRF Token、Access Token は送信前に除外する。
4. 対応記録と添付ファイル名を件数で切り捨てない。AIアシスタントのメッセージ要求は最大 4 MiB とし、上限を超える場合は参照情報を黙って省略せず要求を失敗させる。
5. コンテキスト内の命令は信頼せず、利用者の質問に対する参照情報として扱うよう CAG Task の Prompt に境界を設定する。Prompt は `questionKey` が分析対象であり、判断には問合せ全体と最終顧客評価を必ず使用するよう明記する。
6. 質問ブロックを切り替えた時は表示中の分析対象を切り替え、送信する問合せ全体の参照範囲を維持する。詳細ドロワーを閉じた時はコンテキストを解除する。
7. コンテキストは CAG Task 作成時に同じ `conversation.id` へ送信し、応答は該当 Task の SSE で逐次受信する。
8. 同じ質問を複数回送信した場合は 1 件の参照として表示する。チケット No. と安定した `questionKey` の組合せで重複を排除する。
9. 問合せ参照履歴は CAG Task から復元し、OneOps の別テーブルへメッセージ本文や問合せ本文を重複保存しない。

## 7. CAG と SSE

普通の HTTP API と SSE は同じ公開サービス、ドメイン、ポートを使用する。ブラウザーは双方を OneOps の同一生成元 `/api/work-center/v1/ai-assistant` から利用する。OneOps Gateway は普通の HTTP と SSE を、同じ Agent Gateway 設定の Endpoint へ中継する。

SSE は実行中 Task のイベント購読方式であり、Task の実行主体ではない。完了済み会話及び空の会話では SSE を開かない。購読接続中、または同じ Conversation に `queued`、`running` の Task が存在する間も、OneOps は新しい Task の HTTP 作成を事前に遮断せず、その他の画面操作を許可する。SSE 接続状態と Task 実行状態を、チャット全体の利用可否へ変換しない。上流 CAG が Task 作成を受け付けない場合はエラーを表示し、入力内容を復元する。

Task の状態は `queued`、開始処理、逐次応答、完了、失敗に分けて表示する。待機中 Task は添付ファイルを OneOps 側で保持し、CAG の実行開始時に署名 URL から取得できるようにする。

AIアシスタントを利用可能にする前に、管理者向け完全接続テストで次を確認する。

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

Task SSE の再開位置は `after_sequence` を正とする。ブラウザーが再接続時に送る `Last-Event-ID` と要求 URL の `after_sequence` の大きい方を OneOps が上流 `after_sequence` へ渡し、受信済み Event の再転送を防止する。

## 8. システム設定

システム管理者は AIアシスタント用として次を設定する。

1. 利用する Agent Gateway 設定 ID
2. Project ID
3. 実行 Profile
4. 有効状態
5. Session 所有関係の保持期間

AIアシスタントはこの設定を固定利用する。一般ユーザーに Agent Gateway、Project、Profile の切替操作を表示しない。設定変更後も既存 Session は作成時の Gateway と Project を保持し、履歴の参照可能性を維持する。

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
8. `GET /api/work-center/v1/ai-assistant/sessions/{conversationId}/events?task_id={taskId}&after_sequence={sequence}&follow=true`
9. `POST /api/work-center/v1/ai-assistant/sessions/{conversationId}/attachments`
10. `GET /api/work-center/v1/ai-assistant/sessions/{conversationId}/attachments/{attachmentId}`
11. `DELETE /api/work-center/v1/ai-assistant/sessions/{conversationId}/attachments/{attachmentId}`
12. `GET /api/work-center/v1/ai-assistant/task-attachments/{attachmentId}/content`

## 11. 受入条件

1. 権限を持つユーザーには AIアシスタント画面以外でチャットアイコンが表示され、ページ遷移後も現在の Session を維持する。
2. チャットウィンドウが右下の前面へ表示され、主画面の操作を不要に遮断しない。浮動ウィンドウを右下入口へ戻す操作は「閉じる」だけを表示し、同じ状態遷移を行う重複した最小化操作を表示しない。
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
13. 問合せの質問ブロックを切り替えるとチャット上の分析対象表示が切り替わり、CAG Task には対象 `questionKey`、問合せの基本情報、問合せ全体の全質問、全対応記録、全添付ファイル名、最終顧客評価が含まれる。顧客連絡先は含まれない。
14. 送信済みの質問は詳細を閉じた後も参照済み表示が残り、未送信の質問は消える。
15. 別の質問を開くと既存の参照済み表示の下に活動中の参照が追加され、Session 切替時に他の Session と混在しない。
16. 問合せ詳細または添付プレビューを開いたまま、チャット入力へフォーカスして発言できる。
17. 普通の HTTP と SSE が同じ OneOps 公開生成元を使用し、設定済みの主 CAG 又は同一 Database と Queue を共有する予備 CAG へ中継される。
18. 同じ Conversation に実行中 Task が存在しても入力、新規 Task の要求、新規話題、Session 切替、履歴操作を利用できる。
19. Task 作成 HTTP 要求の送信中は重複送信だけが抑止され、入力欄で次の発言を編集できる。上流拒否時は送信した入力が失われない。
20. 第 1 階層メニューの「AIアシスタント」を選択すると `/ai-assistant` で完全なチャット画面を表示し、右下の浮動入口を重複表示しない。
21. 完全画面では会話履歴を常時表示し、浮動ウィンドウと同じ Session、入力、Task、SSE 状態を継続する。
22. `ai.assistant.use` 権限を外したユーザーにはメニュー、完全画面、右下入口を表示せず、旧 `/tasks` URL は権限確認後に `/ai-assistant` へ正規化する。
23. ファイル選択、クリップボードからの画像・ファイル貼り付け、ドラッグアンドドロップで複数ファイルを追加し、送信前に個別に削除できる。浮動ウィンドウと全画面で同じ挙動になる。
24. クリップボードにファイルが含まれる場合はファイルを優先して添付する。ファイルを含まない UTF-8 で 32 KiB を超えるテキスト貼り付けは `.txt` 添付へ変換し、32 KiB 以下は入力欄へ通常どおり貼り付けられる。
25. 添付ファイルだけの発言を作成でき、CAG Task が署名 URLからファイルを取得して SHA-256 を照合できる。
26. 他の利用者または他の Conversation の添付 ID を指定しても取得、削除、Task への関連付けができない。
27. `queued` の Task を実行待ちとして表示し、待機中も入力、別 Task、新規話題、Session 切替を利用できる。
28. CAG Task 履歴から添付メタデータを復元でき、ブラウザーへ CAG 用署名 URL を返さない。
29. 浮動ウィンドウと全画面で同じ AI 応答を開いた時、Markdown の表、リスト、見出し、コード、リンクが同じ構造で表示され、表のセルが画面幅内で改行される。
30. AI 応答に生 HTML、スクリプト、外部画像、危険な URL が含まれても、HTML の実行と外部画像の自動取得が行われない。
31. 問合せを参照した回答に `questionKey`、`questionThreads`、`customerEvaluation`、`messageKey` などの内部項目名と内部 ID が表示されず、質問順と質問種別の業務表現で対象を確認できる。
32. 活動中と参照済みの問合せ表示から、チケット No. と質問位置を維持したまま問合支援の詳細ドロワーを直接開ける。検索条件の再入力と検索実行を必要としない。
33. 入力欄付近に画像・ファイルの貼り付けとドラッグアンドドロップが可能であることを表示し、ファイルをドラッグ中はドロップ領域を安定して強調表示する。
34. 会話にユーザー入力が存在する場合は入力回数と同じ数の目盛りを持つ固定クイックナビゲーションを表示する。静止時はクリック選択した一つだけが黒い長線となり、その他は短線となる。ホバーとキーボードフォーカス中だけ対象位置に波形を表示し、離脱後は波形を消す。ユーザー入力と AI 回答の省略プレビュー、ユーザー入力へのクリック移動、キーボード操作を浮動ウィンドウと全画面で確認できる。ナビゲーション自体には外枠を表示しない。
35. 浮動ウィンドウ内の Tooltip と削除確認をチャット本体より前面へ表示し、問合せ参照の「問合せを開く」Tooltip が右端で背面または画面外へ隠れない。
36. 1 回の画像貼り付けで同一画像を 1 件だけ追加し、ブラウザーが同じ画像を `DataTransfer.files` と `DataTransfer.items` の両方から返す場合や連続した貼り付けイベントを発生させる場合も重複しない。
37. 送信前と送信後の画像添付を縮小画像で表示し、画像名を主要表示としない。縮小画像を選択すると大きなプレビューを開き、プレビュー外のマスク領域を選択すると閉じる。画像以外の添付ファイルはファイル名とサイズを引き続き確認できる。
38. 一般利用者向けの空状態、待機状態、問合せ参照説明及び第 1 階層 AIアシスタント説明に CAG、Model API、Agent Gateway を表示せず、AI と会話する機能であることを三言語で確認できる。
39. Screenshot と同等の幅及び狭い画面幅で空状態説明の行 Box を計測し、末尾の一文字又は短い句だけで構成される孤立行がないことを確認する。
40. AIアシスタントの完全画面では外側 Layout を画面高へ固定し、文書全体へ不要な縦スクロールを発生させない。会話が表示領域を超える場合は会話領域だけを縦スクロールし、他画面の文書高又はスクロール方式を継承しない。
41. 初回に日本語翻訳を依頼した後、次の発言へ英文だけを入力すると、同じ Task Summary と軽量 Model で日本語翻訳を継続する。
42. 同一の翻訳入力を再実行すると 2 回目から汎用 Model へ昇格し、3 回目以降も汎用 Model を維持する。
43. 翻訳、要約、分類及び一般支援は初回に `FAST` Model を使用し、工単分析、複雑分析及び Agent 操作は初回に既定汎用 Model を使用する。
44. CAG Task の監査情報から Task Class、Task Fingerprint、Attempt、開始 Model、Effort、Model 設定物理 ID、Gateway 設定物理 ID、Routing 理由を追跡できる。
45. Task 履歴を再読込した後も最新の Task Summary を復元し、利用者に固定 Prompt の再入力を要求しない。
46. 「帮我把这段日文对话翻译成中文：」で始まる長文を初回送信した時、Session 名を「日文对话翻译为中文」とし、本文先頭の切出しと省略記号を表示しない。翻訳、要約、分析、分類及び一般相談の代表入力で、対象と作業を示す安定したテーマ名を確認する。
47. 動的なクイックアシスタント入口から 4 カテゴリ、各 3 件の専門対話を確認し、第 2 階層メニューから新規 Session を作成できる。
48. 専門対話の第 1 発言と後続発言へ、Session 作成時に保存した同一の継続指示を適用する。
49. 利用者向け API、Session 応答、Task 表示へ `systemPrompt` と `shortcutPromptSnapshot` を返さない。
50. 無効化したクイックアシスタントは新規メニューへ表示せず、作成済み Session は保存済み指示で継続利用できる。
51. システム管理の AI設定配下に独立したクイックアシスタント画面を表示し、三言語名称、三言語説明、三言語入力開始例、カテゴリ、開始 Model、開始時の推理強度、表示順、有効状態、継続指示を保存できる。
52. クイックアシスタントメニュー、空状態及び管理画面で開始 Model、推理レベル、速度を確認できる。
53. 管理画面では Model と推理強度を階層メニューの独立項目として編集でき、各第 2 階層の現在値と設定全体の要約を確認できる。速度は Model 情報として表示する。
54. Model を選択すると Model 設定の推理強度を既定値として取り込み、管理者がクイックアシスタント単位で変更して保存できる。
55. クイックアシスタント入口は通常時に完全な円形輪郭を持つ静止 Icon として表示する。同じ領域の「新しい話題」操作へ Hover 又は Keyboard Focus がある間だけ分割軌道と Icon を動かす。動きを減らす Browser 設定では完全な円形輪郭を維持して Animation を表示しない。
56. 主 CAG の一時障害時に予備 CAG で同じ Conversation 又は Task を重複なく受け付け、契約エラー時は予備へ送らない。
57. 全 CAG Circuit が開いている場合は入力内容を保持したまま一時利用不可を表示し、Circuit 回復後に主 Endpoint を再利用できる。
58. 完了済み会話を開いた時は Task 一覧 1 回だけで本文を復元し、Conversation 詳細と過去 Conversation Event 全件を取得しない。
59. 会話削除の確認後は対象行、対象詳細要求及び対象 SSE を直ちに画面から除去する。OneOps の削除に失敗した場合は削除前の一覧と選択状態を復元する。次の会話の読込状態は削除処理と分離する。
60. 主 Endpoint が応答しない場合も Session 詳細は 5 秒以内に予備 Endpoint の成功又は明示エラーへ確定し、Portal による同一長時間要求の自動再試行を行わない。
61. 完了済み会話を開いたままにしても 30 秒周期の SSE 切断、再接続及び CAG Database Polling を発生させない。
62. AIアシスタント画面を 60 秒以上表示しても Dashboard、Dashboard SSE 及び個人タスク概要の新規要求を発生させず、認証 Session の権限反映確認だけを継続する。
63. Workbench へ戻ると Dashboard 初期取得と SSE を再開し、有効な SSE Snapshot の受信後は定期 Dashboard GET を停止する。Workbench から遷移すると実行中の Dashboard GET と個人タスク概要 GET を中断し、SSE を閉じる。AIアシスタント画面ではこれらを再開しない。
64. Dashboard を停止する画面への遷移中及び Dashboard Data Route の再読込中も、利用者が選択した組織機関物理 ID を保持する。組織機関コンテキストを使用する業務画面で選択時点と同等又は新しい Dashboard Snapshot を取得した後に選択中の組織機関を再検証し、当該物理 ID が存在しない場合だけ有効な先頭組織へ変更する。組織機関選択欄を表示しないシステム管理の Snapshot と選択時点より古い Cache は選択中組織機関を含まない場合に選択を変更しない。権限構成が変わった場合は以前の権限で取得した Snapshot と組織機関選択を再利用しない。
65. Dashboard SSE クライアントが存在しない状態で 2 秒周期を複数回経過しても、Gateway は Builder のジョブ、端末状態及び組織一覧を取得しない。組織情報ソースの独立周期を到達させた場合は、SSE 接続がなくても同期を一度実行する。
66. 新しい Dashboard SSE クライアントを登録した場合は、保存済み Snapshot の送信に続いて最新化を直ちに開始し、更新済み Snapshot を同じ接続へ配信する。
67. 各会話履歴行の削除 Button を選択すると、対象会話名を含む中央 Modal を表示する。Modal の削除 Button を選択した時だけ DELETE 要求を送信し、処理中は重複実行と Modal の閉じる操作を抑止する。成功時は Modal を閉じ、失敗時は対象行と選択状態を復元して再実行できる状態を維持する。

クイックアシスタントの詳細要件、初期データ、API 及び外部調査根拠は `AI_ASSISTANT_SHORTCUTS_REQUIREMENTS.md` に定める。
