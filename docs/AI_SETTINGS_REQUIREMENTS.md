# AI 設定要件

更新日: 2026-08-12

## 機能目標

OneOps はシステム管理に `AI設定` を提供する。AI 設定は Model API、Agent Gateway、クイックアシスタントの 3 つの独立した子機能を直接含み、AI 接続と専門対話設定を一元管理する。

3 つの子機能はシステム管理ナビゲーションから個別の画面へ移動する。内容領域にタブ切替を置かない。子機能を切り替えた時は、選択した機能の見出し、説明、設定カード、操作だけを表示する。

機能名は画面言語に従って表示する。

| 言語 | Model API 機能 | Agent Gateway 機能 | 専門対話機能 |
| --- | --- | --- | --- |
| 日本語 | モデル接続 | エージェント連携 | クイックアシスタント |
| 中国語 | 模型接入 | 智能代理接入 | 快捷助手 |
| 英語 | Model API | Agent Gateways | Quick assistants |

API、Endpoint、API Key、Access Token、Agent Gateway などのプロトコル名と項目名は一般的な表記を維持する。

AI 設定はシステム単位の設定とし、組織機関コンテキストを表示せず、現在の組織機関で絞り込まない。AI 設定権限を持つシステム管理者だけが設定を表示、保存、接続テストできる。

## Model API 設定

1. 初期 Provider は `OpenAI` とし、AIアシスタントと個人タスクの `GENERAL` は OpenAI Responses API を使用する。
2. 用途は `GENERAL` と `INQUIRY` とする。`GENERAL` は複数件を登録でき、AIアシスタントとクイックアシスタントの開始 Model として使用する。`INQUIRY` は問合せ支援専用の 1 件とする。
3. Endpoint には `/v1` を含む OpenAI 互換 API のルートを入力する。
4. Model には互換 API の Model 一覧が公開する Model ID を入力する。
5. API Key は管理者が入力し、バックエンドで暗号化して保存する。
6. 保存済み API Key は管理画面へ完全に再入力する。読み込み直後はパスワード文字で表示し、システム管理者は原文表示とコピーを利用できる。
7. 各設定は独立した安定物理 ID を持つ。用途、Provider、Model 名を物理関連キーとして使用しない。
8. 各 `GENERAL` は管理用表示名、Model ID、推理レベル `XHIGH`、`HIGH`、`MEDIUM`、速度表示 `FAST`、`MEDIUM`、`SLOW`、表示順、有効状態、既定状態を持つ。
9. 有効な `GENERAL` のうち最大 1 件を既定とする。自由会話と個人タスクは既定 Model、クイックアシスタントは設定済みの開始 Model を新規 Session へ固定する。
10. 推理レベルは Session のスナップショットとして保持し、各 Responses API 要求の `reasoning.effort` へ渡す。速度表示は管理者が実運用の応答傾向に基づいて設定する比較属性とし、`GET {Endpoint}/models` の接続試験時間を生成速度として扱わない。
11. `INQUIRY` は画面上で「問合せデフォルトモデル」と表示し、UPDS 問合せの手動 AI 補助と問合せ全体分析だけに使用する。外部タスク設定画面には Model、Provider、Agent Gateway の選択を置かない。
12. `SIMPLE` を Model 用途又は実行 Tier として保存しない。AIアシスタントと個人タスクの全 Task は Session 作成時の `GENERAL` Model と推理レベルを使用する。
13. Task 分類、同一 Task の再実行回数及び応答速度による Model 切替と推理レベル変更は行わない。Provider Error 時は CAG、Agent Gateway、別 Model 及び別 Endpoint へ迂回せず、対象の Local Task を安定した失敗終端へ確定する。
14. Model ID は手入力させず、Endpoint と API Key を使用した `GET {Endpoint}/models` の応答から選択する。
15. Model 一覧取得 API は重複を除いた Model ID を返し、API Key をブラウザーへ保存又は一覧応答へ含めない。
16. 保存時は選択した Model ID が現在の Endpoint と API Key で取得できることをサーバー側で再確認する。
17. `INQUIRY` の既定状態はサーバー側で常に `true` へ正規化する。画面 Payload に既定状態が含まれない場合も入力不正とせず、保存と接続テストを実行できる。

Model 接続テストは `{Endpoint}/models` へ `GET` を送信し、Endpoint、Bearer 認証、Model 一覧構造、対象 Model ID の存在を確認する。バックエンドは 10 秒の上限時間と 1 MiB の応答上限を使用する。

## Agent Gateway 設定

各 Agent Gateway 設定は次を持つ。

1. 独立した安定物理 ID
2. 管理者が識別できる名称
3. `/api/v1` を含む API Endpoint
4. 任意の Bearer Access Token
5. 有効状態

Access Token の保存と再入力は Model API Key と同じ規則を使用する。Token が未設定の場合は認証のない内部 Agent Gateway への接続を許可する。

各 Agent Gateway は主 API Endpoint と最大 4 件の予備 API Endpoint を保持できる。予備 Endpoint は主 Endpoint と同じ CAG PostgreSQL及び Redis Queue を使用する。OneOps は冪等要求に限定した有限再試行、指数 Backoff、Jitter、Endpoint 単位の Circuit Breaker を使用する。

基本接続テストは `{Endpoint}/projects` へ `GET` を送信し、HTTP 接続、任意の Bearer 認証、Project 一覧構造を確認して Project 件数を返す。

## Agent Gateway Task と SSE

OneOps バックエンドは同一生成元 Proxy を提供し、ブラウザーへ Agent Gateway の Access Token を渡さない。

1. Conversation 作成を `POST {Endpoint}/conversations` へ Proxy する。
2. Task 作成を `POST {Endpoint}/tasks` へ Proxy し、上流は HTTP 202 を直ちに返す。
3. Task イベントを `GET {Endpoint}/tasks/{task_id}/events` から配信する。
4. Conversation イベントを `GET {Endpoint}/conversations/{conversation_id}/events` から配信する。
5. SSE 応答の `id`、`event`、`data`、ハートビートコメントを保持する。
6. `after_sequence`、`follow`、`Last-Event-ID` を Agent Gateway へ伝達する。
7. フロントエンドは sequence 順に並べて重複を除去し、再読込後は最後の sequence から再開する。
8. OneOps はクライアント切断時に上流要求を中止する。

現行 CAG の Task 応答は `id` を使用する。OneOps クライアントは仕様書例の `task_id` も受け付ける。

## AIアシスタントと個人タスクの GPT 直接実行設定

第一期の AIアシスタントと個人タスクは、システム設定の有効な `GENERAL` OpenAI Model を使用する。自由会話と個人タスクは既定 Model、クイックアシスタントは設定済みの開始 Model と推理レベルを Session 作成時に保存する。同じ Session の全 Task は保存済みの Model と推理レベルを固定使用する。

OneOps Gateway は Session が参照する Model 設定物理 ID から Endpoint と暗号化 API Key を取得し、`POST {Endpoint}/responses` を `store: false` かつ `stream: true` で直接呼び出す。OpenAI SSE は OneOps Local Task Event の `task.created`、`task.started`、`agent.message.delta`、`agent.message`、`task.completed`、`task.failed`、`task.cancelled` へ変換する。

OneOps PostgreSQL の Session、Local Task 及び Local Task Event Ledger を会話履歴、Streaming、終端、再開位置及び監査の正式データソースとする。Provider の Response ID、Output 及び Token 使用量は内部 Ledger へ保存し、一般利用者向け API へ返さない。Session、Task、SSE、権限、監査及び Stop の詳細は `AI_ASSISTANT_REQUIREMENTS.md` に従う。

AIアシスタントと個人タスク用の Agent Gateway、CAG Project、Runtime Profile、CAG Task API、互換 Layer 及び Runtime Fallback は設けない。問合せ専用 CAG、顧客ナレッジ Scan その他の Agent Gateway 利用機能は各機能の現行契約を維持し、GPT 直接実行の迂回先に使用しない。

## クイックアシスタント設定

1. AI設定の独立した子画面として表示する。
2. 三言語名称、三言語利用目的、三言語入力開始例、カテゴリ、開始 Model、開始時の推理強度、継続指示、表示順、有効状態を管理する。
3. 参照には `models.settings.read`、作成と更新には `models.settings.write` を必要とする。
4. クイックアシスタントとカテゴリは安定した UUID 物理 ID を持ち、Session との関連は物理 ID の外部キーで保持する。
5. 利用中 Session との参照整合性を維持するため、管理画面へ物理削除操作を表示しない。
6. 初期データ、利用者画面、継続指示及び API の詳細は `AI_ASSISTANT_SHORTCUTS_REQUIREMENTS.md` に従う。
7. 開始設定は Model と推理強度を個別に展開できる階層メニューで編集し、現在値と設定要約を表示する。
8. Model の推理強度は新規選択時の既定値とし、保存時はクイックアシスタント固有の推理強度を保持する。速度は Model の説明属性として表示する。

## セキュリティと監査

1. API Key と Access Token はシステム管理者権限を必要とする HTTPS 設定 API で完全に読み書きし、応答へ `Cache-Control: no-store` を設定する。
2. バックエンドは AES-256-GCM を使用し、追加認証データへ設定物理 ID を使用する。
3. Endpoint に URL のユーザー名、パスワード、Query、Fragment を許可しない。
4. 保存、削除、接続テストは CSRF 検証と `models.settings.write` 権限を必要とする。
5. `models.settings.read` と `models.settings.write` は `SYSTEM_ADMIN` だけへ付与する。
6. 保存、削除、接続テストを操作監査へ記録し、監査詳細へ Secret を含めない。

## API

1. `GET /api/work-center/v1/ai-settings`
2. `POST /api/work-center/v1/ai-settings/models`
3. `PUT /api/work-center/v1/ai-settings/models/{modelSettingId}`
4. `DELETE /api/work-center/v1/ai-settings/models/{modelSettingId}`
5. `POST /api/work-center/v1/ai-settings/models/test`
6. `POST /api/work-center/v1/ai-settings/agent-gateways`
7. `DELETE /api/work-center/v1/ai-settings/agent-gateways/{id}`
8. `POST /api/work-center/v1/ai-settings/agent-gateways/test`
9. `POST /api/work-center/v1/agent-gateways/{id}/conversations`
10. `POST /api/work-center/v1/agent-gateways/{id}/tasks`
11. `GET /api/work-center/v1/agent-gateways/{id}/tasks/{task_id}/events`
12. `GET /api/work-center/v1/agent-gateways/{id}/conversations/{conversation_id}/events`
13. `GET /api/work-center/v1/ai-assistant/shortcuts/admin`
14. `POST /api/work-center/v1/ai-assistant/shortcuts/admin`
15. `PUT /api/work-center/v1/ai-assistant/shortcuts/admin/{shortcutId}`

廃止した `model-settings` API と用途指定型の Model 更新 API は削除する。

## 受入条件

1. システム管理に `AI設定` を表示する。
2. AI 設定ナビゲーションは `モデル接続`、`エージェント連携`、`クイックアシスタント` の 3 つのローカライズ済み子機能を直接表示する。
3. 各子機能は独立した内容画面を持ち、内容領域に切替タブを表示しない。
4. 複数の汎用 Model と 1 件の問合せデフォルト Model を保存して接続テストできる。
5. 複数の Agent Gateway を作成、編集、削除、接続テストできる。
6. 設定画面はシステム管理の内容領域を使用する。
7. 各設定カードのテストと保存操作はカード下部右側へ配置し、主操作を最右側に置く。
8. Secret は再読込後に完全に再入力され、初期状態でマスクされ、原文表示とコピーができる。
9. SSE Proxy がイベント形式を保持し、切断後に再開できる。
10. 自動テスト、本番ビルド、DB Migration、ブラウザー表示、コンソール、スクリーンショットの検証に成功する。
11. Agent Gateway のデスクトップフォームは責務を分けた 2 列構成とする。左列に名称と有効状態、右列に API Endpoint と Access Token を配置する。長い Endpoint、Token、説明は広い列を使用し、操作領域を入力項目の直後へ配置する。
12. Agent Gateway フォームは 900 ピクセル以下で 1 列へ切り替え、項目、説明、操作が重ならず画面外へはみ出さない。
13. Model と Agent Gateway の設定カードは共通操作バーを使用する。更新日時は左側、テスト、削除、保存は右側に配置し、更新日時の有無にかかわらず同じ内側余白と構造を維持する。
14. 有効な `GENERAL` OpenAI Model で Responses API の Streaming、OneOps Local Task Event、単一終端及び `after_sequence` 再開を確認できる。
15. AIアシスタントと個人タスクの新規 Session が開始 Model 設定物理 ID、Model ID、推理レベル及び速度表示を保存し、Agent Gateway、Project 及び Runtime Profile を保持しない。
16. `INQUIRY` 行と複数の `GENERAL` 行が存在する PostgreSQL へ Migration 全体を再実行し、Model 用途制約、既定 Model、クイックアシスタントの有効状態と開始 Model を変更せず、Gateway Readiness と Health が正常であることを確認する。複数 Gateway の同時実行は PostgreSQL Advisory Lock で直列化し、全 SQL を単一 Transaction として扱う。
17. AI設定ナビゲーションへ `クイックアシスタント` を独立表示し、三言語設定、カテゴリ、開始 Model、表示順、有効状態及び継続指示を保存できる。
18. 管理者向けクイックアシスタント API と利用者向け一覧 API の権限を分離し、設定操作を監査できる。
19. Model 一覧とクイックアシスタント選択肢に推理レベルと速度を三言語で表示する。
20. 自由会話、クイックアシスタント及び個人タスクの Session が作成時の Model 物理 ID、Model ID、推理レベル、速度の表示及び監査用スナップショットを保持し、全 Local Task が Session の Model と推理レベルを固定使用する。
21. 主 Endpoint と重複しない予備 Endpoint を最大 4 件保存し、再読込後も順序を維持する。
22. AIアシスタントと個人タスクの実行時に Agent Gateway 及び CAG Task API へ要求を送らず、Responses API と OneOps Local Task/Event Ledger だけを使用する。
23. Provider Error 時に CAG、別 Model 及び別 Endpoint へ自動迂回せず、対象 Local Task を単一の失敗終端へ確定する。

Agent Gateway の 2 列構成の受入証跡は `docs/evidence/agent-gateway-balanced-layout-20260727.png` とする。

画面間隔は `docs/ONEOPS_UI_SPACING_STANDARD.md` に従う。

ローカライズ済み名称の受入証跡は次とする。

1. `docs/evidence/ai-settings-localized-menu-20260727.jpg`
2. `docs/evidence/ai-settings-agent-localized-20260727.jpg`
