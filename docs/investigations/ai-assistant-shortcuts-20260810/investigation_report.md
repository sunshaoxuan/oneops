# AI助手クイックアシスタント調査報告

更新日: 2026-08-10

## 1. 調査質問

AI や業務に詳しくない利用者に対して、自由会話に加えてどのような再利用可能な業務支援を提供するかを調査した。あわせて、OneOps の AI助手へ専門対話、継続指示、管理設定を安全に組み込める経路を確認した。

## 2. 外部調査結果

### 2.1 成熟製品の共通構成

1. OpenAI GPTs は Instructions、Conversation starters、Knowledge、Capabilities、Actions を目的別に組み合わせ、Instructions を各会話へ適用する。
2. OpenAI Skills は指示、例、コードを含む再利用可能な作業手順として管理できる。
3. Microsoft Copilot Prompt Gallery は目的、背景、参照元、期待結果を明確にした定型 Prompt を検索、編集、共有する。
4. Microsoft Copilot Studio は権限、データ接続、テスト、承認、公開、監視を分離する。
5. NIST AI RMF は対象 Task の定義、評価、検証、人による重要判断の確認を推奨する。

### 2.2 OneOps へ採用した内容

1. 初心者が目的から選べる 4 カテゴリと各 3 件の専門対話を初期提供する。
2. 専門対話は名称、説明、入力開始例、継続指示を持つ。
3. 継続指示は Session 作成時にスナップショットとして保存し、同じ Session の各 Task へサーバー側で挿入する。
4. 利用者向け一覧と管理者向け設定 API を分離する。
5. 管理者は AI設定の独立した子画面から設定を作成、編集、無効化する。
6. 重要判断の自動実行は初期範囲に含めず、文章、整理、比較、確認を中心とする。

## 3. OneOps 現状経路

| 経路 | 確認結果 |
| --- | --- |
| 会話作成 | `POST /api/work-center/v1/ai-assistant/sessions` が CAG Conversation を作成し、同じ UUID を OneOps Session ID として保存する |
| 発言送信 | `ai-assistant-routes.mjs` が表示用入力、問合せ情報、添付、Task Routing を統合して CAG Task Prompt を作成する |
| 表示用 Prompt | `[USER_MESSAGE]` 境界から利用者入力だけを復元する |
| Session 所有 | `ai_assistant_sessions.owner_user_id` と現在ユーザー物理 ID を照合する |
| AI設定権限 | `models.settings.read` と `models.settings.write` を使用する |
| 一般利用権限 | `ai.assistant.use` を使用する |
| 設定画面 | システム管理ナビゲーションが独立した子画面 URL を持つ |

## 4. 実装結果

### 4.1 データ

1. `ai_assistant_shortcut_categories` を追加した。
2. `ai_assistant_shortcuts` を追加した。
3. `ai_assistant_sessions` へ `shortcut_id` と `shortcut_prompt_snapshot` を追加した。
4. 全ての強い関連を UUID 物理 ID と外部キーで保持した。
5. Migration の再実行時は管理者が編集した設定を上書きしない。

### 4.2 API と Prompt

1. 利用者向け有効一覧 API を追加した。
2. 管理者向け全設定一覧、作成、更新 API を追加した。
3. Session 作成時に有効なクイックアシスタントを再検証する。
4. 各 Task Prompt へ保存済み継続指示を挿入する。
5. `systemPrompt` と `shortcutPromptSnapshot` を利用者向け Session 応答から除外する。
6. 利用一覧、管理操作、Session 作成、Task 送信を操作監査へ分類する。

### 4.3 画面

1. 完全画面の「新しい話題」の右側へアニメーション付き入口を追加した。
2. 浮動画面のヘッダーにも同じ入口を追加した。
3. hover と click でカテゴリを表示し、カテゴリから第 2 階層の専門対話を表示する。
4. ArrowRight による第 2 階層展開を確認した。
5. 専門 Session の空状態へ名称、説明、入力開始例を表示する。
6. AI設定へ独立 URL の `クイックアシスタント` 子画面を追加した。
7. 管理画面でカテゴリ、三言語名称、三言語説明、三言語開始例、表示順、有効状態、継続指示を編集できる。

## 5. 検証済み事実と制限

| 主張 | 証拠 | 確度 | 制限 |
| --- | --- | --- | --- |
| 継続指示を全 Task へ適用する | Gateway 路由試験、Prompt 境界試験 | 高 | 実 CAG への専門会話送信は未実施 |
| 物理 ID と外部キーを使用する | Migration、PostgreSQL 実行結果 | 高 | なし |
| 4 カテゴリ 12 件を提供する | Migration、Frontend DOM、管理画面 Screenshot | 高 | 初期文言の運用評価は今後必要 |
| 管理 API と利用 API の権限を分離する | `auth.test.mjs` | 高 | 実ユーザーの権限変更試験は未実施 |
| UI と Console が正常である | Browser fixture、Console 0 件、Screenshot | 中 | 正式 HTTPS の認証済み画面は未確認 |
| 候補 Backend と Node Gateway が起動する | 8094、8095 Health | 高 | 正式 Nginx 流量は切り替えていない |

## 6. 結論

第一段階として必要な専門対話、継続 Prompt、管理設定、権限、監査、物理 ID、三言語 UI はコードと隔離実行環境で確認できた。正式 HTTPS 環境の認証済み Browser と正式配信は未実施であり、正式リリースの完了条件には到達していない。
