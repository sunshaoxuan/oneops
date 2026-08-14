# AIアシスタント要件

更新日: 2026-08-12

## 1. 機能境界

AIアシスタントは OneOps 全体から利用できる独立した共通機能とする。第一期はシステム設定の OpenAI Model API を直接使用し、OneOps が Session、Task、Event、履歴及び終端を管理する。問合せ支援の AI 補助とは設定、会話、履歴及び監査を混在させない。CAG は AIアシスタントの実行経路に使用せず、成熟後の再評価対象とする。

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
12. 現在の Session で送信済みの問合せ参照は、詳細ドロワーを閉じても灰色の「参照済み」として保持する。
13. 送信前の問合せ参照は詳細ドロワーを閉じた時に除去する。
14. 別の質問を開いた時は、参照済みの問合せの下へ現在の質問を活動状態で追加し、1 つの Conversation で複数の問合せを扱えるようにする。
15. 第 1 階層の AIアシスタント画面では、浮動ウィンドウと同じ React 状態、Session、SSE 接続を使用して全幅表示する。左側へ会話履歴、右側へ会話本文と入力欄を常時表示する。
16. 浮動ウィンドウの最大化操作は AIアシスタント画面へ遷移する。遷移時に別のチャット実体や重複 SSE 接続を作成しない。
17. AIアシスタント画面の表示、右下入口、Session 操作、Task 作成、SSE 購読はすべて `ai.assistant.use` 権限を必要とする。ロール権限分配画面では「AIアシスタント」行の「実行」操作として表示する。
18. 浮動ウィンドウと全画面の AI 応答は共通の Markdown 表示を使用する。CommonMark に加えて、表、取り消し線、タスクリスト、自動リンクを含む GitHub Flavored Markdown を解釈する。
19. 見出し、段落、箇条書き、番号付きリスト、引用、インラインコード、コードブロック、水平線、リンク、表を画面幅に合わせて表示する。表は利用可能な横幅に収めてセル内を自動改行し、会話領域全体へ横スクロールを発生させない。コードブロックは自身の領域内で横スクロールできるようにする。
20. 浮動ウィンドウと全画面の会話本文には、外枠のない固定クイックナビゲーションを表示する。各目盛りは 1 回のユーザー入力だけを表し、AI 発言用の目盛りは作らない。目盛りは長い会話にも対応できるよう中央へ密に並べ、利用可能な高さが不足する場合は間隔を圧縮する。静止時は選択済みの目盛りだけを黒く長く表示し、その他を同じ長さの短線とする。選択済みの目盛りは別の目盛りを選択するまで維持する。マウスをナビゲーション上で移動している間、またはキーボードで目盛りへフォーカスしている間だけ、対象目盛りを頂点として前後 3 件を距離に応じて段階的に短くする波形を表示する。マウスがナビゲーションを離れるかフォーカスが外れた時は波形を消す。目盛りを選択すると対応するユーザー入力を会話領域内へ表示する。目盛りのホバーまたはキーボードフォーカスでは、固定幅のプレビューにユーザー入力を太字 1 行で省略表示し、その AI 回答を最大 3 行で省略表示する。会話本文のスクロール位置から波形または選択位置を自動変更しない。
21. 生成途中の応答も受信済み本文を Markdown として再評価し、SSE の delta に Markdown 記号をそのまま残さない。構文が未完了の間も他の Session と他画面の操作を継続できるようにし、現在の Session の Composer は 4.12 に従って制御する。
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

1. OneOps が生成する UUID を AI Session の安定物理 ID として使用する。
2. 各 AI Session は所有者である OneOps ユーザー物理 ID を外部キーとして保持する。
3. 1 人の OneOps ユーザーは複数の AI Session を所有できる。
4. 各 AI Session は作成時に一つの有効な `GENERAL` Model 設定を選択し、Model、推理強度及び速度のスナップショットを保持する。
5. 公開 API の `{conversationId}` は OneOps Session の物理 ID を使用する。OneOps は API 処理前に現在ユーザーの所有関係を検証する。
6. 新規話題を選択した時点で OneOps Session を作成し、Session 物理 ID と OneOps ユーザー物理 ID の所有関係を保存する。
7. Session 名は最初のユーザー発言と Task Routing から会話テーマを自動生成する。本文先頭の固定文字数を切り出さず、対象、作業及び方向を短い業務表現へ要約する。翻訳は原文言語、内容種別及び翻訳先言語を組み合わせ、例えば中国語画面では「日文対話を中国語へ翻訳」に相当する「日文对话翻译为中文」とする。要約、分析及び分類も「文書要約」「問合せ分析」のように対象と作業を明示する。テーマを安全に確定できない場合は利用言語に応じた「一般相談」を使用し、本文の一部と省略記号を Session 名にしない。問合せコンテキストがある場合はチケット No. を先頭へ付与する。
8. Session は `ACTIVE`、`ARCHIVED` の状態を持つ。履歴一覧の削除は所有者条件を検証した上で Session、Task 及び Event を外部キー Cascade により削除する。活動中 Task がある場合は削除とアーカイブを拒否する。
9. 利用者は自分が所有する Session だけを一覧、表示、更新、アーカイブ、削除できる。管理者による閲覧は専用監査権限と監査記録を必須とする。
10. Session 一覧は更新日時の新しい順とし、タイトル、最終発言時刻、状態を表示する。
11. クイックアシスタントから作成した Session は、クイックアシスタント物理 ID を外部キーとして保持する。
12. クイックアシスタントから作成した Session は、作成時の継続指示をスナップショットとして保持する。自由会話では両項目を `NULL` とする。
13. 全ての Session は作成時の開始 Model 設定物理 ID、Model ID、推理レベル、速度を表示及び監査用スナップショットとして保持する。
14. 自由会話は有効な `GENERAL` の既定 Model を開始 Model とする。クイックアシスタントは自身に保存された開始 Model と推理強度を使用する。同じ Session の全 Task はこの開始 Model と推理強度を固定使用する。
15. 管理者が設定を変更または無効化した後も、既存 Session の Model、推理強度、速度及び継続指示スナップショットは変更しない。実行時に対応する Model 設定又は API Key が利用できない場合は、Task を安定した設定エラーへ確定する。

## 4. メッセージと履歴

1. OneOps PostgreSQL の AI Session、Task 及び Task Event Ledger をメッセージ履歴の正式データソースとする。
2. OneOps は所有者、表示タイトル、状態、最終 Task ID、利用者入力、公開添付、問合せ参照、Routing、回答本文、Provider 出力、Token 使用量、エラー及び終端を保存する。
3. ユーザー発言は Local Task の `prompt`、完了済み AI 発言は `final_report.summary`、実行中 AI 発言は Local Task Event の `agent.message.delta` と `agent.message` から復元する。
4. OneOps Task ID、Event ID と Task sequence を追跡情報として使用する。
5. 各 Turn の正式回答前に GPT Responses API へ構造化された意図分析を一度送信する。意図分析は入力の意味をモデルで判定し、固定キーワード又は言語列挙を使用しない。
6. 意図分析は過去文脈の参照有無と範囲を `none`、`latest_turn`、`conversation` で返す。参照が必要な場合だけ該当する過去 Task の正式出力を正式回答の Responses Input へ再送する。
7. 意図分析結果は Local Task Ledger へ保存し、構造化出力が不正な場合は正式回答を開始せず安定した失敗終端へ確定する。
5. 受信途中の delta は同じ Task の AI 発言へ順序どおりに反映する。`agent.message` 受信後に確定状態へ変更する。
6. 同じ Event ID または同じ Task sequence を再受信してもメッセージ本文を重複追加しない。
7. 画面再読込時は OneOps の Task 一覧を一度取得し、完了済み Task は `final_report.summary` から復元する。未完了 Task は Session ごとに最大 1 件とし、その Task SSE を取得済み sequence から開始する。
8. Session 一覧、所有関係及び会話内容は所有者確認後に OneOps から取得する。
9. Session ごとに独立した履歴、入力欄、未完了 Task、SSE cursor を持つ。Session 切替時に別 Session の応答を混在させない。
10. 問合せコンテキストと利用者入力を Local Task の独立項目として保存し、履歴表示では利用者の入力部分だけを発言本文として表示する。
11. 保存済み `prompt` の問合せ境界から Task ごとの参照情報を復元し、Session 単位の問合せ参照履歴として表示する。
12. 同じ Conversation に未完了 Task が存在する間も、現在の TextArea と通常文字の貼り付けを有効にし、Session 単位の次回 Draft を入力、選択、削除及び編集できる状態を維持する。`Enter` 送信、新規 Task の作成、添付選択、File Input、ファイル貼り付け及び Drag and Drop は無効化し、送信 Button の位置へ現在の Task を停止する Button を表示する。新規話題、別 Session への切替、履歴操作及び別 Conversation の送信は独立して利用できる状態を維持する。
13. Task 作成 HTTP 要求の開始から Task が終端状態へ到達するまで、現在の Conversation を単一実行状態として扱う。同期的な操作 Lock で連続した `Enter`、二重 Click 及び複数の送信入口からの重複要求を抑止する。
14. クイックアシスタントの継続指示はブラウザーから送信せず、OneOps が保存済みスナップショットを各 Responses API 要求の `instructions` へ挿入する。
15. Local Task の表示用 Prompt、会話履歴及び利用者向け Session API には利用者が入力した本文と公開用のクイックアシスタント概要だけを返し、継続指示を返さない。
16. Session 詳細 API は画面が使用する Task ID、状態、表示用 Prompt、公開添付、問合せ参照、公開 Routing 状態、エラー、`final_report.summary` と日時だけを返す。Conversation の重複取得、内部監査 URL、内部 Report 項目を返さない。
17. AIアシスタント画面では Workbench 用 Dashboard Query、Dashboard SSE、接続状態カード及び個人タスク概要 Query を開始しない。画面遷移時に実行中の Dashboard Query を中断し、既存 EventSource を閉じる。
18. Dashboard の定期 GET は Workbench で有効な SSE Snapshot を未受信の場合だけ補助的に実行する。EventSource の接続成立だけでは定期 GET を停止しない。有効な Snapshot の受信後は定期 GET を停止し、15 秒間 Snapshot を受信しない場合は再開する。認証 Session の定期確認はロール権限変更を画面へ反映するため維持する。
19. Gateway は起動時に Dashboard Snapshot を一度更新する。2 秒周期の Dashboard 更新は有効な Dashboard SSE クライアントが存在する間だけ実行する。Dashboard GET は随時最新化を実行し、新しい SSE クライアントの登録直後にも最新化を開始する。
20. 組織情報ソースの定期同期は Dashboard SSE の接続状態から分離する。最後の SSE クライアントが切断された後は Builder のジョブ、端末状態及び組織一覧を 2 秒周期で取得せず、組織情報ソースは設定済み周期で同期を継続する。
21. Task の終端状態は `completed`、`failed`、`cancelled` とする。`queued` と `running` は未完了として扱う。
22. Gateway は Conversation と所有者に対応する Session 行を PostgreSQL Transaction 内で原子的に Lockし、同じ Transaction で Local Ledger の未完了 Task を確認する。未完了 Task、Lock 競合又は活動 Task 一意制約競合を検出した場合は `AI_ASSISTANT_RESPONSE_IN_PROGRESS` を伴う HTTP 409 を返し、新しい Task を作成しない。
23. 単一実行制御は進行中の Task、SSE 購読及び回答生成を継続させる。新しい送信の拒否を理由とした自動取消し又は SSE の切断は実行せず、利用者が明示的に停止 Button を選択した場合だけ現在の Task の取消しを要求する。
24. 発言送信の非同期処理は送信開始時の Session ID を固定して使用する。Task Cache、Session 名、入力復元及び添付状態を別 Session へ反映しない。
25. 個人タスクから新しい AI Session と最初の Task を作成する処理も、同じ Repository の Conversation Lock 内で Task 作成と `last_task_id` 更新を行う。Portal から同じ Session を開いた場合も別の Task 作成経路として扱わない。
26. Stop API は所有者に対応する Session 行を Message 作成と同じ PostgreSQL Transaction 境界で Lockし、Lock 済み行の `last_task_id` が停止対象と一致すること及び Local Task の `conversation_id` が Session と一致することを確認する。過去 Task、別 Conversation の Task 及び別利用者の Task は停止しない。
27. Stop API は Local Task に Cancel Request を保存した後、対象 Responses API の HTTP 接続だけを Abortする。HTTP 202 は取消受付として扱い、現在の Task SSE を維持して `task.cancelled`、`task.completed` 又は `task.failed` の終端を確認するまで次の送信を許可しない。
28. Stop 操作は Session ID、Task ID 及び試行 ID の組で重複実行と古い Callback を抑止する。停止開始後に Session を切り替えても開始元 Task の SSE を終端まで継続し、取消結果、Draft、Reply 及び Cache は停止開始時の Session と Task だけへ適用する。
29. `task.cancelled` は利用者による停止状態として `task.failed` から分離する。現在の画面で受信済みの部分回答を保持し、処理 Loader と工程表示を終了して三言語の中立的な停止文言を表示する。
30. 取消時の受信済み部分回答は Event 履歴として保持し、確定した `final_report` として保存しない。画面再読込後は部分回答を完全回答として復元せず、`cancelled` 状態と停止文言だけを復元する。
31. Stop HTTP 要求が失敗した場合は現在の SSE、部分回答及び Draft を維持し、次の送信を許可せず、開始元 Session と Task にだけ三言語の再試行可能な停止エラーを表示する。
32. Task 作成 HTTP 要求を送信済みで Task ID がまだ返っていない間は TextArea の編集を許可し、送信 Button を要求中表示とする。安全に特定できる Task ID がないため、この段階では Stop 操作を表示しない。

### 4.1 Task Routing と会話内 Task Summary

Model の選択単位は Session とする。自由会話は `GENERAL` 用途の既定 Model、クイックアシスタントは設定済み開始 Model を選択し、同じ Session の全 Task で Model と推理強度を固定する。速度は表示属性として扱い、実行時 Routing に使用しない。

1. OneOps は各利用者入力を `TRANSLATION`、`SUMMARIZATION`、`CLASSIFICATION`、`GENERAL_ASSIST`、`COMPLEX_ANALYSIS`、`INQUIRY_ANALYSIS` 又は `AGENT_OPERATION` に分類する。
2. 全 Task Class は Session の開始 Model と推理強度を使用する。Task Class による Model 切替と再実行による Model 昇格は行わない。
3. 同じ Task Fingerprint の再実行回数は監査情報として記録し、Model と推理強度は変更しない。
4. Task ごとに Session から複製した Model 設定物理 ID、Model ID、推理強度及び構造化 Routing を Local Task Ledger へ保存する。
5. Task Fingerprint は Task Class、翻訳先言語、制約及び正規化した現在入力から SHA-256 で生成する。Prompt、翻訳先言語、用語又は添付が実質的に変わった場合は新しい Task として扱う。
6. 回答生成前の構造化 Semantic Intent Analysis は会話履歴、現在入力及びクイックアシスタントの固定指示を意味として理解し、Task Class、目的要約、翻訳先言語、制約及び直前 Task の継続有無を生成する。分類はキーワード、固定表現又は言語別単語一覧へ依存しない。既存の Intent Analysis 呼出しを使用し、分類専用の追加 Model 呼出しは行わない。
7. 後続入力に新しい作業の明示がない場合は、直前の Task Summary を自動継続する。単方向翻訳では後続の本文だけの入力にも翻訳先言語と書式、用語、出力条件を適用する。日中相互翻訳では Task Class と一般制約を継続し、翻訳先言語は現在入力の言語から毎 Turn 再判定する。翻訳対象本文に分析、解析、実装その他の作業表現が含まれても Task Class を変更しない。
8. 新しい作業が明示された場合は Task Summary を更新し、その入力から新しい Task 系列を開始する。
9. Task Summary は Local Task の Routing JSON へ保存する。OneOps は同じ Session の最新 Task から Summary を復元し、次の Responses API `instructions` へ信頼済み状態として渡す。
10. 一般利用者向け回答及び公開 Task API には Task Summary の内部項目名、Model 設定物理 ID、Model ID、Routing 理由及び Fingerprint を表示しない。公開 Routing は `taskClass` と `targetLanguage` に限定する。
11. Responses API には Session Snapshot の `model` と小文字化した `reasoning.effort` を送る。Local Task の `routing.tier` は `SESSION`、`selectionReason` は `SESSION_STARTING_MODEL` とする。
12. 監査には Task ID、Attempt 番号、Task Fingerprint、Task Class、Model 設定物理 ID、Routing Policy Version、Selection Reason、Latency、Token 使用量及び終端を記録可能にする。

### 4.2 GPT 直接実行と可用性制御

1. OneOps の Session、Task 及び Task Event Ledger を会話履歴、継続状態、SSE、終端及び監査の正式データソースとする。
2. Gateway は Session の Model 設定に保存された OpenAI 互換 Endpoint、暗号化 API Key 及び Model ID を使用して `/responses` を直接呼び出す。
3. 要求は `store: false`、`stream: true` とし、Session の推理強度を `reasoning.effort` へ送る。多輪履歴は過去の利用者入力と完全な Provider Output を OneOps から再構成する。
4. HTTP `401` と `403`、`404`、`413`、`429`、その他 HTTP Error、非 SSE 応答、壊れた Event、Event 上限超過及び不完全終了を個別の安定 Error Code へ分類する。
5. 同期 Responses 接続は一 Task 当たり 10 分を上限とし、利用者の Stop、Gateway Shutdown 又は Timeout で対象接続だけを Abortする。
6. Gateway 起動時に残存する `queued` と `running` Task は `AI_ASSISTANT_GATEWAY_RESTARTED` の Failed 終端へ一回だけ確定する。
7. Provider SSE は逐次 Local Event Ledger へ保存し、Portal には OneOps の同一生成元 SSE として提供する。Provider 接続を Browser へ直接公開しない。
8. Model API の CAG Runtime Fallback、互換 Layer、予備 CAG Endpoint 及び Python JSONL 実行経路は追加しない。
9. Provider の細分化された Delta は UTF-8 で 512 Bytes 又は 50 Milliseconds を上限とする小さな Batch へ結合して Local Event Ledger へ保存する。逐 Token の Database Transaction を避け、逐次表示と確定本文の一致を維持する。
10. Stop、Shutdown 又は Timeout の Abort Signal は、Network Buffer から取り出した各 Provider Event の処理前と Completed 確定前に再確認する。Local Ledger が Delta 追加を拒否した場合も残存 Event を処理せず、既存 Cancel Request に従って `task.cancelled` を確定する。

## 5. 添付ファイルと大容量貼り付け

1. 浮動ウィンドウと全画面の入力欄は、ファイル選択、クリップボードからの画像・ファイル貼り付け、ドラッグアンドドロップによる複数ファイル添付を受け付ける。`DataTransfer.files` と file 種別の `DataTransfer.items` の両方を処理し、同じ転送内で同じ画像を重複追加しない。連続した同一貼り付けイベントに対しても、アップロード待機列の同期判定で同じ画像を 1 件に保つ。
2. 送信前の画像添付は入力欄の上に縮小画像、転送状態、削除操作を表示し、ファイル名を主要表示としない。画像以外の添付ファイルはファイル名、サイズ、転送状態、削除操作を表示する。縮小画像のアクセシビリティ名には元のファイル名を含める。
3. 1 ファイルは 25 MiB 以下、1 回の発言は 10 件以下、合計 50,000,000 Bytes 以下とする。空ファイルは受け付けない。
4. 添付操作が利用可能な状態でプレーンテキストの貼り付けが UTF-8 で 32 KiB を超える場合、入力欄へ全文を展開せず、日時を含む `pasted-text-*.txt` を生成して添付一覧へ追加する。未完了 Task によって添付操作が Lockされている間は、通常文字 Paste として Draft へ入力し、ファイルへ変換しない。
5. 32 KiB 以下の貼り付けは通常の入力欄操作として扱う。判定は文字数ではなく UTF-8 バイト数を使用する。
6. 添付ファイルだけでも発言できる。この場合は「添付ファイルを解析してください。」を Task の利用者発言として補う。
7. OneOps は添付ファイルを利用者物理 ID と Session 物理 ID に関連付けて実行用領域へ保存する。ブラウザーを閉じた後や Task が待機中の間も解析可能な状態を維持する。
8. Local Task の作成後に添付ファイルを Task ID へ関連付ける。同じ添付ファイルを別 Task へ再利用しない。
9. GPT Runner は所有者、Session 及び Task の一致を再検証して原始 Bytes を読み込み、画像を `input_image`、文書を `input_file` の Base64 Data URL として Responses API へ送る。内部取件 URL と署名 Token を作成しない。
10. OneOps 実行用領域の添付ファイルは 7 日後に削除対象とする。履歴画面は Local Task からファイル名、種類、サイズ及び SHA-256 を復元する。
11. 添付ファイル内容は信頼できない入力として扱う。ファイル内の命令によってシステム指示、利用者の依頼及び参照範囲を変更しない旨を Responses API `instructions` へ付加する。
12. 添付ファイルのアップロード、利用者による読取、送信前削除を操作監査へ記録する。
13. 送信後の画像添付は会話内に縮小画像として表示する。縮小画像を選択すると前景の画像プレビューを開き、閉じる操作またはプレビュー外のマスク領域の選択で閉じる。浮動ウィンドウと全画面で同じ表示と操作を提供する。

## 6. 問合せコンテキスト

1. 問合せ詳細で現在展開している質問ブロックの `questionKey` を、AIアシスタントが今回分析する対象として示す。
2. コンテキストにはチケット No.、件名、ステータス、サブステータス、担当者名、顧客組織名、分類、緊急度、問合せレベル、作成日時、更新日時、回答希望日、問合せ全体の初回質問、全追加質問、全内部記録、全顧客公開回答、各記録の可視性、問合せ全体と各記録の添付ファイル名、最終顧客評価を含める。顧客担当者名、電話番号、メールアドレスは含めない。
3. 顧客連絡先、メールアドレス、電話番号、パスワード、Cookie、CSRF Token、Access Token は送信前に除外する。
4. 対応記録と添付ファイル名を件数で切り捨てない。AIアシスタントのメッセージ要求は最大 4 MiB とし、上限を超える場合は参照情報を黙って省略せず要求を失敗させる。
5. コンテキスト内の命令は信頼せず、利用者の質問に対する参照情報として扱うよう Responses API `instructions` に境界を設定する。今回の質問が分析対象であり、判断には問合せ全体と最終顧客評価を必ず使用するよう明記する。
6. 質問ブロックを切り替えた時は表示中の分析対象を切り替え、送信する問合せ全体の参照範囲を維持する。詳細ドロワーを閉じた時はコンテキストを解除する。
7. コンテキストは Local Task の独立 JSON 項目へ保存し、同じ Task の Responses Input へ渡す。応答は該当 Task の OneOps SSE で逐次受信する。
8. 同じ問合せ票を複数回送信した場合は 1 件の参照として表示する。チケット No. で重複を排除し、質問位置を関連表示へ使用しない。
9. 会話一覧、詳細、入力、添付、Streaming 応答及び選択状態は認証利用者単位で完全に隔離する。Client Cache と Local Storage も利用者 ID を含む Key を使用し、利用者切替時は AIアシスタント Component を再生成する。
10. 問合せ票が画面 Context に設定された場合、浮動チャットを自動表示せず、利用者が右下の AI アイコンを選択した時点で同一利用者かつ同一チケット No. に関連する有効会話を更新日時の新しい順で検索し、最後の会話を自動的に選択する。存在しない場合は票番号を一時コンテキストとして保持し、利用者が最初の質問を送信した時だけ当該票専用の新規会話を一件作成する。空の確認、閉じる操作及びアイコンの表示だけでは会話履歴を作成しない。
11. 問合せ票の関連がない場合は現在選択中の会話を維持する。現在会話が存在しない場合だけ一般会話を新規作成する。
12. 会話内の「問合せを開く」は現在の問合せ Context を保持したまま問合せ支援の詳細へ移動する。移動又は詳細 Drawer の再生成によって会話を一般会話へ変換せず、同じチケット No. の関連表示を維持する。
13. 問合せ Context がある未作成状態は仮想トピックとして扱い、空状態では利用者に新規トピック作成を要求しない。最初のメッセージ送信時にだけ実会話を作成する。
9. 問合せ参照履歴は所有者条件を満たす Local Task から復元する。

## 7. GPT Streaming と OneOps SSE

普通の HTTP API と SSE は同じ公開サービス、ドメイン、ポートを使用する。ブラウザーは双方を OneOps の同一生成元 `/api/work-center/v1/ai-assistant` から利用する。OneOps Gateway は OpenAI Responses SSE を Local Task Event へ変換し、Provider Endpoint と API Key を Browser へ公開しない。

SSE は実行中 Task のイベント購読方式であり、Task の実行主体ではない。完了済み会話及び空の会話では SSE を開かない。同じ Conversation に未完了 Task が存在する間は、その Task の SSE 購読と回答生成を継続し、新しい Task の HTTP 作成を Portal と Gateway の両方で遮断する。利用者は同じ Session の次回 Draft を編集でき、明示的な Stop 操作で現在の Task だけを取消できる。取消要求の HTTP 202 後も SSE を閉じず、終端 Event を受信してから送信能力を復元する。別 Conversation とその他の画面操作は独立して利用できる状態を維持する。Gateway が `AI_ASSISTANT_RESPONSE_IN_PROGRESS` を返した場合は三言語の実行中案内を表示し、対象 Session の入力内容を保持する。

Task の状態は `queued`、`running`、逐次応答、`completed`、`failed`、`cancelled` に分けて表示する。待機中 Task の添付ファイルは OneOps 側で保持し、GPT Runner が Task 所有権を再検証して原始 Bytes を読み込む。

AIアシスタントを利用可能にする前に、管理者向け完全接続テストで次を確認する。

1. Endpoint と API Key で `/models` を取得し、Session が使用する Model ID が一覧に存在する。
2. `/responses` が `store: false`、`stream: true`、Session の `reasoning.effort` を受け付ける。
3. Provider が `text/event-stream` を返し、`response.created`、`response.output_text.delta` 及び `response.completed` を解析できる。
4. Provider Output と Token 使用量を保存し、次回 Task の入力へ完全な Output Item を再送できる。
5. Provider Delta を `agent.message.delta`、確定本文を `agent.message` へ変換できる。
6. `task.completed`、`task.failed`、`task.cancelled` を Local Ledger の単一終端として認識できる。
7. OneOps SSE を `after_sequence` で再開し、Event ID と sequence で重複を排除できる。
8. SSE を逐次解析し、四 MiB 未満の単一 Event を処理できる。多数の小 Event が一つの Network Chunk に入っても Chunk 合計値で拒否しない。
9. 画像と文書を正式 Responses Input 形式で送信できる。
10. Browser 切断、OneOps SSE 再接続、Provider 切断、Stop、Timeout 及び最大 Event サイズを制御できる。
11. Stop 後に Provider の Buffer 済み Delta と Completed Event を処理せず、Local Ledger の Cancel Marker 又は Abort Signal から速やかに `task.cancelled` へ到達できる。

Task SSE の再開位置は `after_sequence` を正とする。Browser が再接続時に送る `Last-Event-ID` と要求 URL の `after_sequence` の大きい方から Local Event Ledger を取得し、受信済み Event の再転送を防止する。

## 8. システム設定

システム管理者は AIアシスタント用として次を設定する。

1. `GENERAL` Model の表示名
2. OpenAI 互換 Endpoint と暗号化 API Key
3. `/models` から取得した Model ID
4. 推理強度、速度表示、有効状態及び既定状態
5. クイックアシスタントごとの開始 Model、推理強度及び継続指示

自由会話は作成時の既定 Model、クイックアシスタントは設定済み開始 Model を Session 単位で固定利用する。一般ユーザーに Endpoint、API Key 及び内部 Routing を表示しない。設定変更後も既存 Session は作成時の Model、推理強度、速度及び継続指示スナップショットを保持する。

## 9. セキュリティと監査

1. Browser は Model API Key を保持しない。暗号化 API Key の復号と Provider Authorization Header の生成は Gateway 内に限定する。
2. Session、Task、SSE の API は認証ユーザー物理 ID による Conversation 所有者条件を必須とする。
3. ユーザー入力を信頼できない内容として扱い、入力内の命令で OneOps のシステム指示を変更させない。
4. パスワード、Cookie、CSRF Token、保存済み Secret を Model API へ送信しない。
5. Session 作成、表示、名称変更、アーカイブ、削除、発言送信、Task 開始、停止、完了、失敗、SSE 再接続を操作監査へ記録する。
6. 監査には OneOps ユーザー物理 ID、Session ID、Task ID、Model 設定物理 ID、Task Class、Routing Policy、結果及び所要時間を含める。
7. Responses API が返した入力、出力、合計及び Cached Token 使用量を内部 Task Ledger へ保存する。公開 Session API へ Provider Output と Token 使用量を返さない。

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
12. `POST /api/work-center/v1/ai-assistant/sessions/{conversationId}/tasks/{taskId}/cancel`

## 11. 受入条件

1. 権限を持つユーザーには AIアシスタント画面以外でチャットアイコンが表示され、ページ遷移後も現在の Session を維持する。
2. チャットウィンドウが右下の前面へ表示され、主画面の操作を不要に遮断しない。浮動ウィンドウを右下入口へ戻す操作は「閉じる」だけを表示し、同じ状態遷移を行う重複した最小化操作を表示しない。
3. 新規話題ごとに OneOps が異なる UUID を Session ID として発行する。
4. 同一ユーザーが複数 Session を所有し、Session ごとの履歴を切り替えられる。
5. 他ユーザーが所有する Session ID を指定しても詳細、Task、SSE を取得できない。
6. Responses API の delta が OneOps SSE から逐次表示され、完了後の本文と一致する。
7. 再接続時に保存済み sequence から再開し、文字列を重複表示しない。
8. Session を切り替えても Task、メッセージ、cursor が混在しない。
9. 新規話題、自動名称生成、各履歴行からの削除、履歴復元を確認できる。
10. 問合せ AI 補助が引き続き Model API だけを使用する。
11. 操作監査と Local Ledger でユーザー、Session、Task、Model、推理強度、Routing、結果及び Token 使用量を追跡できる。
12. 単体テスト、本番ビルド、ブラウザー表示、コンソール、SSE 再接続、権限分離を検証する。
13. 問合せの質問ブロックを切り替えるとチャット上の分析対象表示が切り替わり、Local Task と Responses Input には対象 `questionKey`、問合せの基本情報、問合せ全体の全質問、全対応記録、全添付ファイル名及び最終顧客評価が含まれる。顧客連絡先は含まれない。
14. 送信済みの質問は詳細を閉じた後も参照済み表示が残り、未送信の質問は消える。
15. 別の質問を開くと既存の参照済み表示の下に活動中の参照が追加され、Session 切替時に他の Session と混在しない。
16. 問合せ詳細または添付プレビューを開いたまま、チャット入力へフォーカスして発言できる。
17. 普通の HTTP と SSE が同じ OneOps 公開生成元を使用し、Provider Endpoint、API Key 及び Provider Output を Browser へ公開しない。
18. 同じ Conversation に未完了 Task が存在する間も TextArea と通常文字 Paste で次回 Draft を編集できる。`Enter`、新規 Task 作成、添付選択、File Paste 及び Drag and Drop は無効になり、送信位置に現在の Task を停止する Button が表示される。新規話題、Session 切替、履歴操作及び別 Conversation の送信は利用できる。
19. Task 作成 HTTP 要求の送信中は TextArea の編集を維持しながら同期的な送信 Lock が有効になり、連続した `Enter` と二重 Click が 1 件の要求に集約される。失敗時の入力復元は送信開始時の Session だけへ適用される。
20. 第 1 階層メニューの「AIアシスタント」を選択すると `/ai-assistant` で完全なチャット画面を表示し、右下の浮動入口を重複表示しない。
21. 完全画面では会話履歴を常時表示し、浮動ウィンドウと同じ Session、入力、Task、SSE 状態を継続する。
22. `ai.assistant.use` 権限を外したユーザーにはメニュー、完全画面、右下入口を表示せず、旧 `/tasks` URL は権限確認後に `/ai-assistant` へ正規化する。
23. ファイル選択、クリップボードからの画像・ファイル貼り付け、ドラッグアンドドロップで複数ファイルを追加し、送信前に個別に削除できる。浮動ウィンドウと全画面で同じ挙動になる。
24. クリップボードにファイルが含まれる場合はファイルを優先して添付する。ファイルを含まない UTF-8 で 32 KiB を超えるテキスト貼り付けは `.txt` 添付へ変換し、32 KiB 以下は入力欄へ通常どおり貼り付けられる。
25. 添付ファイルだけの発言を作成でき、GPT Runner が所有者、Session、Task、SHA-256 を検証した原始 Bytes を Responses Input へ変換できる。
26. 他の利用者または他の Conversation の添付 ID を指定しても取得、削除、Task への関連付けができない。
27. `queued` の Task を実行待ちとして表示し、待機中も現在の TextArea で次回 Draft を編集できる。新規 Task 作成と添付操作は無効化し、Stop、新規話題及び Session 切替は利用できる。
28. Local Task 履歴から添付メタデータを復元でき、Browser と Model API へ内部取件 URL と署名 Token を返さない。
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
41. 初回に日本語翻訳を依頼した後、次の発言へ英文だけを入力すると、同じ Task Summary、Session Model 及び推理強度で日本語翻訳を継続する。
42. 同一の翻訳入力を再実行すると Attempt が増加し、Model と推理強度は Session の開始設定を維持する。
43. 翻訳、要約、分類、一般支援、問合せ分析、複雑分析及び Agent 操作の全てが Session の開始 Model と推理強度を使用する。
44. Local Task Ledger から Task Class、Task Fingerprint、Attempt、Session Model、Effort、Model 設定物理 ID及び Routing 理由を追跡できる。公開 Task API は内部 Model 情報と Fingerprint を返さない。
45. Task 履歴を再読込した後も最新の Task Summary を復元し、利用者に固定 Prompt の再入力を要求しない。
45-1. 日中相互翻訳 Session で「ME 会根据 OneOps 当前用户显示名解析 UPDS 真实负责人值。本次用户对应负责人值为 113210。」を後続入力した場合は `TRANSLATION` を継続し、複雑分析の三段階 Process 表示を行わない。日本語、英語又は他の言語で同等の本文を入力した場合も言語別 Keyword へ依存せず同じ判定とする。
45-2. 日中相互翻訳 Session で複数回の日本語から中国語への翻訳後に中国語本文を入力した場合、現在入力だけを翻訳対象として日本語へ翻訳する。直前の日本語原文及び中国語訳文を最終生成の会話 Context へ含めず、直前の翻訳先言語を継承しない。反対方向の切替も同じ契約とする。
46. 「帮我把这段日文对话翻译成中文：」で始まる長文を初回送信した時、Session 名を「日文对话翻译为中文」とし、本文先頭の切出しと省略記号を表示しない。翻訳、要約、分析、分類及び一般相談の代表入力で、対象と作業を示す安定したテーマ名を確認する。
47. 動的なクイックアシスタント入口から 4 カテゴリ、各 3 件の専門対話を確認し、第 2 階層メニューから新規 Session を作成できる。
48. 専門対話の第 1 発言と後続発言へ、Session 作成時に保存した同一の継続指示を適用する。
49. 利用者向け API、Session 応答、Task 表示へ `systemPrompt` と `shortcutPromptSnapshot` を返さない。
50. 無効化したクイックアシスタントは新規メニューへ表示せず、作成済み Session は保存済み指示で継続利用できる。
51. システム管理の AI設定配下に独立したクイックアシスタント画面を表示し、三言語名称、三言語説明、三言語入力開始例、カテゴリ、開始 Model、開始時の推理強度、表示順、有効状態、継続指示を保存できる。
52. クイックアシスタントメニュー、空状態及び管理画面で開始 Model、推理レベル、速度を確認できる。
53. 管理画面では Model と推理強度を階層メニューの独立項目として編集でき、各第 2 階層の現在値と設定全体の要約を確認できる。速度は Model 情報として表示する。
54. Model を選択すると Model 設定の推理強度を既定値として取り込み、管理者がクイックアシスタント単位で変更して保存できる。
55. AIアシスタント Header の新しい話題 Button と独立快捷入口を表示しない。履歴ガイドでは新しい話題の主 Segment と二重矢印の快捷 Segment を一体の分割 Button として表示する。通常時は完全に静止し、分割 Button 全体へ Hover 又は Keyboard Focus がある間だけ二重矢印を発光させる。快捷 Segment へ Hover、Keyboard 実行又は Click がある時だけカテゴリ別 Menu を表示し、Reduced Motion では静的強調へ切り替える。
56. Model API の認証、Model 不在、入力上限、Rate Limit、HTTP、SSE 契約及び不完全終了を安定 Error Code へ分類し、入力内容を対応 Session に保持する。
57. Provider Error 時は CAG、別 Model 又は別 Endpoint へ自動迂回せず、対象 Task を Failed の単一終端へ確定する。
58. 完了済み会話を開いた時は Task 一覧 1 回だけで本文を復元し、Conversation 詳細と過去 Conversation Event 全件を取得しない。
59. 会話削除の確認後は対象行、対象詳細要求及び対象 SSE を直ちに画面から除去する。OneOps の削除に失敗した場合は削除前の一覧と選択状態を復元する。次の会話の読込状態は削除処理と分離する。
60. Model API が応答しない場合は一 Task 10 分の上限で対象 Task を Failed へ確定し、Session 詳細と過去履歴の読込を Provider 状態から分離する。
61. 完了済み会話を開いたままにしても周期的な SSE 切断、再接続及び Provider Polling を発生させない。
62. AIアシスタント画面を 60 秒以上表示しても Dashboard、Dashboard SSE 及び個人タスク概要の新規要求を発生させず、認証 Session の権限反映確認だけを継続する。
63. Workbench へ戻ると Dashboard 初期取得と SSE を再開し、有効な SSE Snapshot の受信後は定期 Dashboard GET を停止する。Workbench から遷移すると実行中の Dashboard GET と個人タスク概要 GET を中断し、SSE を閉じる。AIアシスタント画面ではこれらを再開しない。
64. Dashboard を停止する画面への遷移中及び Dashboard Data Route の再読込中も、利用者が選択した組織機関物理 ID を保持する。組織機関コンテキストを使用する業務画面で選択時点と同等又は新しい Dashboard Snapshot を取得した後に選択中の組織機関を再検証し、当該物理 ID が存在しない場合だけ有効な先頭組織へ変更する。組織機関選択欄を表示しないシステム管理の Snapshot と選択時点より古い Cache は選択中組織機関を含まない場合に選択を変更しない。権限構成が変わった場合は以前の権限で取得した Snapshot と組織機関選択を再利用しない。
65. Dashboard SSE クライアントが存在しない状態で 2 秒周期を複数回経過しても、Gateway は Builder のジョブ、端末状態及び組織一覧を取得しない。組織情報ソースの独立周期を到達させた場合は、SSE 接続がなくても同期を一度実行する。
66. 新しい Dashboard SSE クライアントを登録した場合は、保存済み Snapshot の送信に続いて最新化を直ちに開始し、更新済み Snapshot を同じ接続へ配信する。
67. 各会話履歴行の削除 Button を選択すると、対象会話名を含む中央 Modal を表示する。Modal の削除 Button を選択した時だけ DELETE 要求を送信し、処理中は重複実行と Modal の閉じる操作を抑止する。成功時は Modal を閉じ、失敗時は対象行と選択状態を復元して再実行できる状態を維持する。
68. 同じ Conversation へ同時に 2 件の発言要求を送った場合、Local Task は 1 件だけ作成され、もう 1 件は HTTP 409 と `AI_ASSISTANT_RESPONSE_IN_PROGRESS` で終了する。Responses API も 1 回だけ呼び出される。
69. `queued`、`running` 及び未知の Task 状態では Draft 編集を許可しながら新規送信を拒否し、`completed`、`failed` 又は `cancelled` へ到達した後に Draft を保持したまま送信能力を復元する。
70. Session A の発言要求中に Session B へ切り替えても、Session A の Task、入力復元、添付状態及び自動生成名が Session B の Cache と画面へ混在しない。
71. 実行中案内を日本語、中国語及び英語で表示し、次回 Draft を入力できること、回答の終端前は送信できないこと及び Stop 操作を利用できることを明示する。
72. 個人タスクの AI 分析は既定 GPT Model の新しい Session と Local Task を作成し、Portal と同じ Task Ledger、単一実行制約及び GPT Runner を使用する。
73. 回答生成中に文字入力、削除、選択、通常文字 Paste 及び `Shift + Enter` の改行を実行でき、`Enter` では 2 件目の Task を作成しない。
74. Stop Button を選択すると、選択時に固定した Session ID、最新 Task ID 及び試行 ID だけへ Cancel Request を一件保存し、該当 Responses 接続だけを Abortする。連続 Click、Session 切替、古い Callback 及び別 Conversation の実行状態によって対象が変化しない。
75. Stop HTTP 202 後も開始元 Task の SSE を維持し、別 Session へ切り替えた場合も終端 Event の前は送信能力を復元しない。`task.cancelled` の受信後は Draft を保持したまま Send Button と送信能力を復元する。
76. 回答本文の一部を受信後に Stop した場合は受信済み本文を保持し、「停止」を通常の失敗 Alert と分離して表示する。本文未受信の場合も処理 Loader を終了して停止状態を表示する。
77. Stop 要求が失敗した場合は SSE と現在の回答を継続し、Draft を保持し、再度 Stop を実行できる。送信能力は Task の終端まで復元しない。
78. Stop と自然完了が競合した場合は Local Task Row Lock が確定した単一の終端 Event に従い、`task.completed`、`task.failed` と `task.cancelled` を同じ Task の画面終端として重複表示しない。
79. Session A の停止処理中に Session B へ切り替えた場合は、Session A の停止 SSE を終端まで継続し、各 Session の Draft、Stop 状態、Task、Reply 及び SSE が混在しない。Session A へ戻った時は現在画面で受信済みの部分回答を維持する。
80. 正式環境で Queued Stop と Running Stop を実 Task で確認し、`task.cancelled` が 1 件、`task.completed` と `task.failed` が 0 件であること及び CAG に新しい Task が作成されないことを確認する。
81. 正式 Browser の生成中画面で TextArea の入力、削除、選択、通常文字 Paste 及び `Shift + Enter` を確認し、`Enter` 後の新規 Message と Task が 0 件であることを確認する。
82. Stop 選択後も Draft と TextArea を維持し、Cancel Route が 1 件、HTTP 202 であり、終端まで Send と添付を復元しないことを確認する。
83. Session A の停止処理中に Session B へ切り替え、Session B の Draft と Stop 状態が Session A から独立していることを確認する。
84. Session A の `task.cancelled` 後に部分回答、Draft、中立的な停止文言、失敗 Alert の非表示、Send と添付の復元を確認する。
85. 保持した Draft を送信した時、新しい Task が 1 件だけ作成され、自然完了することを確認する。
86. Cancelled Session の再読込後に停止状態を復元し、Streaming Loader と未確定部分回答を完全回答として復元しないことを確認する。
87. 生成中、停止受付中、取消終端及び自然完了の Screenshot、Console Error 0 件及び Warning 0 件を確認する。
88. 会話の末尾 Task が回答本文を受信せず失敗した場合は、失敗表示と同じ行の右端に小型の文字 Button を表示する。Button は保存済みの質問、添付及び問合せ参照を同じ Session の新しい Task として再送信する。過去の失敗 Task、回答本文を受信済みの Task 及び実行中 Task には表示せず、自動再送信は行わない。

クイックアシスタントの詳細要件、初期データ、API 及び外部調査根拠は `AI_ASSISTANT_SHORTCUTS_REQUIREMENTS.md` に定める。
# AI Provider使用量記録

AI Providerへの各Requestは、`AI_TOKEN_USAGE_REPORT_REQUIREMENTS.md` に従って呼出単位Ledgerへ保存する。意図分析と回答生成はそれぞれ独立した呼出として扱い、ProviderのUsage Feedbackと終端状態を記録する。
