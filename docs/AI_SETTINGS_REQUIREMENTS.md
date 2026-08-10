# AI 設定要件

更新日: 2026-08-10

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

1. 初期 Provider は `OpenAI` とし、OpenAI 互換 API を使用する。
2. 用途は `GENERAL` と `INQUIRY` とする。`GENERAL` は複数件を登録でき、AI助手とクイックアシスタントの開始 Model として使用する。`INQUIRY` は問合せ支援専用の 1 件とする。
3. Endpoint には `/v1` を含む OpenAI 互換 API のルートを入力する。
4. Model には互換 API の Model 一覧が公開する Model ID を入力する。
5. API Key は管理者が入力し、バックエンドで暗号化して保存する。
6. 保存済み API Key は管理画面へ完全に再入力する。読み込み直後はパスワード文字で表示し、システム管理者は原文表示とコピーを利用できる。
7. 各設定は独立した安定物理 ID を持つ。用途、Provider、Model 名を物理関連キーとして使用しない。
8. 各 `GENERAL` は管理用表示名、Model ID、推理レベル `XHIGH`、`HIGH`、`MEDIUM`、速度表示 `FAST`、`MEDIUM`、`SLOW`、表示順、有効状態、既定状態を持つ。
9. 有効な `GENERAL` のうち最大 1 件を既定とする。自由会話は Session 作成時の既定 Model を使用し、クイックアシスタントは設定された開始 Model を使用する。
10. 推理レベルは CAG Task の `effort` へ渡す実行パラメーターとする。速度表示は管理者が実運用の応答傾向に基づいて設定する比較属性とし、`GET {Endpoint}/models` の接続試験時間を生成速度として扱わない。
11. `INQUIRY` は画面上で「問合せデフォルトモデル」と表示し、UPDS 問合せの手動 AI 補助と問合せ全体分析だけに使用する。外部タスク設定画面には Model、Provider、Agent Gateway の選択を置かない。
12. `SIMPLE` 用途、Task 分類による Model 切替、同一 Task 再実行時の自動昇格を使用しない。

Model 接続テストは `{Endpoint}/models` へ `GET` を送信し、Endpoint、Bearer 認証、Model 一覧構造、対象 Model ID の存在を確認する。バックエンドは 10 秒の上限時間と 1 MiB の応答上限を使用する。

## Agent Gateway 設定

各 Agent Gateway 設定は次を持つ。

1. 独立した安定物理 ID
2. 管理者が識別できる名称
3. `/api/v1` を含む API Endpoint
4. 任意の Bearer Access Token
5. 有効状態

Access Token の保存と再入力は Model API Key と同じ規則を使用する。Token が未設定の場合は認証のない内部 Agent Gateway への接続を許可する。

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

## AI助手接続設定

全体 AI助手は問合せ支援から独立して CAG を利用する。システム管理者は AI助手用の Agent Gateway、Project ID、実行 Profile、有効状態、履歴保持期間を設定する。

AI助手用の完全接続テストは `/projects` の確認に加えて、Conversation、Task、Task SSE、delta 本文、完了イベント、`after_sequence` 再開までを検証する。完全接続テストを満たさない設定は AI助手で利用可能にしない。

一般ユーザーは Agent Gateway、Project、Profile を切り替えない。各 AI Session は作成時の設定 ID と Project を保持する。Session、会話履歴、権限、監査の詳細は `AI_ASSISTANT_REQUIREMENTS.md` に従う。

## クイックアシスタント設定

1. AI設定の独立した子画面として表示する。
2. 三言語名称、三言語利用目的、三言語入力開始例、カテゴリ、開始 Model、開始時の推理レベル、開始時の速度、継続指示、表示順、有効状態を管理する。
3. 参照には `models.settings.read`、作成と更新には `models.settings.write` を必要とする。
4. クイックアシスタントとカテゴリは安定した UUID 物理 ID を持ち、Session との関連は物理 ID の外部キーで保持する。
5. 利用中 Session との参照整合性を維持するため、管理画面へ物理削除操作を表示しない。
6. 初期データ、利用者画面、継続指示及び API の詳細は `AI_ASSISTANT_SHORTCUTS_REQUIREMENTS.md` に従う。
7. 開始設定は Model、推理レベル、速度を個別に展開できる階層メニューで編集し、現在値と設定要約を表示する。
8. Model の推理レベルと速度は新規選択時の既定値とし、保存時はクイックアシスタント固有の推理レベルと速度を独立して保持する。

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
14. AI助手の完全接続テストが Conversation、Task、delta SSE、終端、`after_sequence` 再開を確認する。
15. AI助手用設定が Gateway、Project、Profile、履歴保持期間を保存できる。
16. `INQUIRY` 行と複数の `GENERAL` 行が存在する PostgreSQL へ Migration 全体を再実行し、Model 用途制約と Gateway Health が正常であることを確認する。
17. AI設定ナビゲーションへ `クイックアシスタント` を独立表示し、三言語設定、カテゴリ、開始 Model、表示順、有効状態及び継続指示を保存できる。
18. 管理者向けクイックアシスタント API と利用者向け一覧 API の権限を分離し、設定操作を監査できる。
19. Model 一覧とクイックアシスタント選択肢に推理レベルと速度を三言語で表示する。
20. 自由会話とクイックアシスタント Session が作成時の Model 物理 ID、Model ID、推理レベル、速度のスナップショットを保持し、後続 Task で変更しない。

Agent Gateway の 2 列構成の受入証跡は `docs/evidence/agent-gateway-balanced-layout-20260727.png` とする。

画面間隔は `docs/ONEOPS_UI_SPACING_STANDARD.md` に従う。

ローカライズ済み名称の受入証跡は次とする。

1. `docs/evidence/ai-settings-localized-menu-20260727.jpg`
2. `docs/evidence/ai-settings-agent-localized-20260727.jpg`
