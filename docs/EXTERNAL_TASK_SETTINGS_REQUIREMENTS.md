# 外部タスク設定要件

更新日: 2026-08-04

## 1. 目的

システム管理の「外部タスク」で複数の外部業務サイトをシステム共通設定として管理する。個人接続と個人資格情報は使用せず、利用者と外部ユーザーの対応は統一ユーザー外部档案で管理する。設定値は `models.settings.read` と `models.settings.write` の権限境界で保護する。

接続ごとの同期間隔はシステム設定で管理し、既定値を 10 分とする。

## 2. 画面構成

外部タスク設定はシステム管理の独立した子機能とする。内容領域には次のカードを縦に配置する。

1. `UPDS サポートサイト`
2. `Backlog`

各カードは接続先、認証情報、有効状態、接続テスト、保存操作を持つ。カード見出しには「システム共通」を明示する。秘密情報は初期状態でマスクし、権限を持つ管理者が原文表示とコピーを利用できる。

## 3. UPDS サポートサイト

UPDS カードは既存設定を引き継ぎ、次を保存する。

1. ログイン URL
2. 製品コード `UPDS`
3. 共通ログインユーザー
4. 暗号化パスワード
5. 有効状態

接続テストは既存の UPDS ログイン処理を使用する。Model、Provider、Agent Gateway の選択は表示しない。

## 4. Backlog

Backlog カードは次を保存する。

1. ログイン URL
2. 任意の API URL
3. 共通ログインユーザー
4. 暗号化パスワード
5. 任意の暗号化 API Key
6. 有効状態

API URL が空の場合はログイン URL の Origin を基準とする。API URL を指定する場合はログイン URL と同一 Origin に限定する。接続先は HTTPS の `backlog.com`、`backlog.jp`、`backlogtool.com` 配下に限定し、URL のユーザー名、パスワード、Query、Fragment を許可しない。

Backlog 公式 API の認証方式は API Key と OAuth 2.0 である。API Key が保存されている場合、接続テストは `/api/v2/users/myself` を呼び出して認証と本人情報を確認する。API Key がない場合、ログイン URL へ到達できることを確認し、結果を「ログイン画面」として表示する。この結果を画面ログイン認証成功とは表示しない。

公式仕様: `https://developer.nulab.com/ja/docs/backlog/auth/`

## 5. 問合せデフォルトモデル

問合せ AI 補助の Model 設定を外部タスクから AI 設定へ移動する。AI 設定の Model API 画面に `INQUIRY` 用途を追加し、表示名を「問合せデフォルトモデル」とする。

問合せ AI 補助と問合せ全体分析は、実行時に `INQUIRY` 設定の安定物理 ID、Model ID、API Key 設定状態を確認する。設定が不足する場合は `INQUIRY_DEFAULT_MODEL_NOT_CONFIGURED` として実行を開始しない。問合せ AI 補助は Agent Gateway へ自動切替しない。

`INQUIRY` が未登録又は無効な場合は実行を開始せず、管理者に問合せデフォルトモデルの設定を要求する。別用途の Model へ自動切替しない。

## 6. データとセキュリティ

1. UPDS と Backlog は別の安定物理 ID を持つ。
2. `code` と `product_code` は表示と分類に使用し、物理 ID の代替にはしない。
3. ユーザー名、パスワード、API Key は暗号化資格情報として保存する。
4. 監査詳細、エラー、URL Query へ秘密情報を出力しない。
5. Backlog API とログイン画面のテスト結果は認証済み状態を区別する。
6. 外部タスク設定の読み書きと接続テストを `EXTERNAL_TASK_SETTINGS` として監査する。

## 7. API

次の現行 API を使用する。

1. `GET /api/work-center/v1/inquiry-support/settings`
2. `PUT /api/work-center/v1/inquiry-support/settings`
3. `POST /api/work-center/v1/inquiry-support/settings/test`
4. `PUT /api/work-center/v1/inquiry-support/settings/backlog`
5. `POST /api/work-center/v1/inquiry-support/settings/backlog/test`
6. `GET /api/work-center/v1/ai-settings`
7. `POST /api/work-center/v1/ai-settings/models` 又は `PUT /api/work-center/v1/ai-settings/models/{modelSettingId}`
8. `POST /api/work-center/v1/ai-settings/models/test`

## 8. 受入条件

1. システム管理の名称が「外部タスク」へ変更される。
2. UPDS サポートサイトの既存設定が維持される。
3. Backlog のログイン URL、任意 API URL、ユーザー名、パスワード、任意 API Key、有効状態を保存できる。
4. API Key の有無によって API 認証とログイン画面到達確認を明確に区別する。
5. 外部タスク画面に Model、Provider、Agent Gateway の選択を表示しない。
6. AI 設定に「問合せデフォルトモデル」を表示し、保存と接続テストができる。
7. 問合せ AI 補助が `INQUIRY` 用途だけを使用する。
8. 単体試験、完全チェック、DB Migration、正式ビルド、ブラウザー、コンソール、スクリーンショットの検証に成功する。
