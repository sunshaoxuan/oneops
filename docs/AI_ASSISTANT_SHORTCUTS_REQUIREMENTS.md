# AI助手クイックアシスタント要件

更新日: 2026-08-10

## 1. 目的

AI や対象業務に詳しくない利用者が、自由入力の会話だけに依存せず、目的が明確な定型支援を選択して仕事を始められるようにする。

クイックアシスタントは、管理者が定義した専門目的、継続指示、利用開始例を持つ。利用者が選択すると専用の新規話題を作成し、同じ話題の全発言で作成時の継続指示を適用する。

## 2. 外部製品調査から採用する構成

2026-08-10 時点の公式情報を調査し、次の構成を採用する。

| 調査対象 | 確認した構成 | OneOps での採用 |
| --- | --- | --- |
| OpenAI GPTs | Instructions、Conversation starters、Knowledge、Capabilities、Actions、Preview、Version history | 名称、説明、継続指示、開始例、管理画面、既存会話用の指示スナップショット |
| OpenAI Skills | 指示、例、コードを含む再利用可能な作業手順と管理者制御 | システム提供の再利用可能な専門支援として管理 |
| Microsoft Copilot Prompt Gallery | 目的、背景、参照元、期待結果を含む編集可能な定型 Prompt | 初心者が作業目的を選び、具体的な入力例を確認できる構成 |
| Microsoft Copilot Studio | 権限、公開範囲、テスト、監査、段階的な公開管理 | システム管理者による設定、無効化、既存権限、操作監査 |
| NIST AI RMF | 対象 Task の定義、評価、検証、人による確認 | 専門目的を限定し、事実と推論を分離し、重要判断は利用者が確認する指示 |

参照先:

1. OpenAI, Creating and editing GPTs, https://help.openai.com/en/articles/8554397-creating-and-editing-gpts
2. OpenAI, GPTs in ChatGPT, https://help.openai.com/en/articles/8554407-what-are-gpts
3. OpenAI, Skills in ChatGPT, https://help.openai.com/en/articles/20001066
4. Microsoft, Write a great prompt in Microsoft 365 Copilot, https://support.microsoft.com/en-us/microsoft-365-copilot/write-a-great-prompt-in-microsoft-365-copilot
5. Microsoft, Manage your Copilot Studio projects, https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/sec-gov-intro
6. NIST, Artificial Intelligence Risk Management Framework, https://www.nist.gov/itl/ai-risk-management-framework

## 3. 初期カテゴリとクイックアシスタント

初期データは、保守的な組織で人が成果物を確認しやすい文章、整理、比較、品質確認の支援に限定する。

| カテゴリ | クイックアシスタント |
| --- | --- |
| 言語と文章 | 日中相互翻訳、文章推敲、読み手別書き換え |
| 文書と会議 | 要約と要点整理、議事録と対応事項、業務メール作成 |
| 業務整理 | 課題分解、確認一覧作成、比較と判断材料整理 |
| 品質確認 | 抜け漏れ確認、矛盾確認、提出前レビュー |

全ての初期クイックアシスタントは、次の共通原則を継続指示に含める。

1. 入力の意味、数値、固有名詞を維持する。
2. 不明点が結果を左右する場合は、短い確認質問を先に提示する。
3. 入力に存在しない事実を補完しない。
4. 事実、推論、提案を区別する。
5. 法務、財務、人事、セキュリティなどの重要判断は、担当者による確認事項を明示する。
6. 利用者が専門目的の変更を求めた場合は、新しい話題から別のクイックアシスタントを選択するよう案内する。

## 4. 利用者画面

1. 完全画面の会話履歴上部で、「新しい話題」の右側に動的なクイックアシスタントアイコンを表示する。
2. 浮動画面のヘッダーでも、新規話題操作の右側に同じ入口を表示する。
3. アイコンへマウスを置くと第 1 階層にカテゴリを表示し、カテゴリへマウスを置くと第 2 階層に複数のクイックアシスタントを表示する。
4. キーボード操作とクリック操作でも同じ項目を選択できる。
5. クイックアシスタントを選択すると、その物理 ID を指定して新しい Session を作成する。
6. Session の初期名称はクイックアシスタント名とする。
7. 選択中のクイックアシスタント名と説明を会話の空状態へ表示する。
8. 通常の「新しい話題」は従来どおり継続指示を持たない自由会話を作成する。
9. 無効なカテゴリと無効なクイックアシスタントは新規作成メニューへ表示しない。

## 5. 継続指示

1. Session 作成時にクイックアシスタント物理 ID と継続指示のスナップショットを保存する。
2. 同じ Session の全発言で保存済みスナップショットを CAG Task Prompt の先頭へ挿入する。
3. ブラウザーから継続指示を送信しない。
4. 利用者画面、Task 表示、会話履歴には利用者が入力した本文だけを表示する。
5. 管理者が設定を変更した場合、新規 Session は更新後の指示を使用する。既存 Session は作成時の指示を継続使用する。
6. 管理者が設定を無効化した場合、新規選択を停止する。既存 Session は利用を継続できる。

## 6. データモデル

### 6.1 カテゴリ

1. `id`: 安定した UUID 物理 ID
2. `code`: 管理用コード
3. `name_ja`、`name_zh`、`name_en`: 表示名称
4. `icon`: システム定義アイコンキー
5. `sort_order`: 表示順
6. `enabled`: 有効状態
7. `created_at`、`updated_at`: 監査時刻

### 6.2 クイックアシスタント

1. `id`: 安定した UUID 物理 ID
2. `category_id`: カテゴリ物理 ID への外部キー
3. `code`: 管理用コード
4. `name_ja`、`name_zh`、`name_en`: 表示名称
5. `description_ja`、`description_zh`、`description_en`: 利用目的
6. `starter_prompt_ja`、`starter_prompt_zh`、`starter_prompt_en`: 入力開始例
7. `system_prompt`: 全発言へ継続適用する指示
8. `sort_order`: カテゴリ内の表示順
9. `enabled`: 有効状態
10. `created_by_user_id`、`updated_by_user_id`: 利用者物理 ID への外部キー
11. `created_at`、`updated_at`: 監査時刻

### 6.3 Session 追加項目

1. `shortcut_id`: クイックアシスタント物理 ID への外部キー。自由会話では `NULL` とする。
2. `shortcut_prompt_snapshot`: 作成時の継続指示。自由会話では `NULL` とする。

## 7. 管理画面

1. システム管理の `AI設定` に独立した子画面 `クイックアシスタント` を追加する。
2. 内容領域のタブ切替は使用しない。
3. `models.settings.read` を持つ利用者は全設定を表示できる。
4. `models.settings.write` を持つ利用者は新規作成、編集、有効状態変更を実行できる。
5. 管理者はカテゴリ、三言語名称、三言語説明、三言語入力開始例、継続指示、表示順、有効状態を定義する。
6. 一覧ではカテゴリ、名称、目的、有効状態、更新日時を確認できる。
7. 編集画面では継続指示を複数行で確認し、保存前に対象目的との整合性を確認できる。
8. 利用中 Session との外部キー整合性を維持するため、物理削除操作を提供しない。

## 8. API

1. `GET /api/work-center/v1/ai-assistant/shortcuts`: 利用者向け有効設定一覧
2. `GET /api/work-center/v1/ai-assistant/shortcuts/admin`: 管理者向け全設定一覧
3. `POST /api/work-center/v1/ai-assistant/shortcuts/admin`: クイックアシスタント作成
4. `PUT /api/work-center/v1/ai-assistant/shortcuts/admin/{shortcutId}`: クイックアシスタント更新
5. `POST /api/work-center/v1/ai-assistant/sessions`: 任意の `shortcutId` を受け付ける

## 9. セキュリティと監査

1. 利用者向け一覧と Session 作成には `ai.assistant.use` を必要とする。
2. 管理者向け参照には `models.settings.read`、保存には `models.settings.write` を必要とする。
3. Session 作成時にサーバー側で有効な物理 ID を再検証する。
4. 継続指示は管理 API だけで読み書きし、利用者向け一覧と Session API へ返さない。
5. 作成と更新を操作監査へ記録し、変更対象の物理 ID を追跡する。

## 10. 受入条件

1. 初期 4 カテゴリへ各 3 件、合計 12 件のクイックアシスタントが登録される。
2. 新しい話題の右側に動的入口が表示される。
3. ホバー、クリック、キーボードでカテゴリと専門対話を選択できる。
4. 選択した専門対話の Session が独立して作成され、名称と説明を確認できる。
5. 同じ Session の第 1 発言と後続発言へ同一の保存済み継続指示が挿入される。
6. 利用者向け API と画面へ継続指示が露出しない。
7. 設定変更後の新規 Session と変更前の既存 Session が、それぞれ対応する指示を使用する。
8. 無効な設定は新規作成メニューから消え、既存 Session は継続利用できる。
9. AI 設定の独立した子画面で新規作成、編集、有効状態変更を実行できる。
10. 三言語表示、権限分離、CSRF、物理 ID と外部キー、操作監査を確認できる。
11. 関連単体テスト、Gateway テスト、Frontend テスト、本番ビルド、DB Migration を完了する。
12. 稼働環境で利用者画面と管理画面を確認し、Console、Screenshot、API 応答を証跡として保存する。
