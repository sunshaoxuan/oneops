# 外部タスク設定及び問合せデフォルトモデル 調査・実装記録

## 1. 結論

システム管理の従来の問合支援設定を「外部タスク」へ変更し、UPDSサポートサイトと Backlog をシステム共通接続として分離した。問合せ AI 補助の Model 設定は AI 設定の `INQUIRY` 用途へ移し、表示名を「問合せデフォルトモデル」とした。

Backlog 公式 API は API Key または OAuth 2.0 を使用する。システム共通カードは API Key がある場合だけ API 認証を確認し、API Key がない場合はログイン URL 到達確認として扱う。到達確認を画面ログイン認証成功とは表示しない。

## 2. 実装経路

| 領域 | 実装 |
| --- | --- |
| システム管理 | `InquirySupportSettingsPage.tsx` を外部タスク設定の 2 カード構成へ変更 |
| Backlog 契約 | `external-task-settings.mjs` で URL 制約、API Key 認証、ログイン URL 到達確認を実装 |
| 保存 | `inquiry_source_settings` を `ONEHR_UPDS` と `BACKLOG_SYSTEM` の 2 物理レコードへ拡張 |
| AI 設定 | `ai_model_settings.purpose` へ `INQUIRY` を追加 |
| AI 実行 | 問合せ実行時に `INQUIRY` Model だけを解決し、Agent Gateway へ切り替えない |
| 既存値移行 | 旧選択 Model、次に `GENERAL` の順で新しい `INQUIRY` 物理 ID へ復号、再暗号化 |
| 監査 | 設定操作を `EXTERNAL_TASK_SETTINGS` として分類 |

## 3. Backlog 認証調査

Backlog Developer API の公式認証資料は API Key と OAuth 2.0 を案内している。ユーザー名とパスワードはログイン画面フォールバック用として保持し、API 認証済みとは扱わない。

参照: `https://developer.nulab.com/ja/docs/backlog/auth/`

## 4. セキュリティ判断

1. UPDS と Backlog の資格情報はレコード物理 ID を追加認証データとして暗号化する。
2. Backlog API URL はログイン URL と同一 Origin に限定する。
3. Backlog 接続先は許可済み公式ドメインの HTTPS に限定する。
4. API Key、パスワード、認証 Header を監査とエラーへ出力しない。
5. 旧 Model API Key の密文を新しい物理 ID へ直接コピーしない。

## 5. 公開結果

0.9.0 の Portal、Spring Backend、Legacy Gateway を正式環境へ公開した。Migration 027 の `api_url` 列と `INQUIRY` 制約を PostgreSQL で確認した。既存の `gpt-5.6-terra` は `INQUIRY` 用途へ安全に移行済みである。

## 6. 未完了の画面確認

正式ページはメールとパスワードのログイン画面まで確認した。ログイン後の外部タスク 2 カード、問合せデフォルトモデル、コンソール、スクリーンショットは利用者ログイン後に追記する。
