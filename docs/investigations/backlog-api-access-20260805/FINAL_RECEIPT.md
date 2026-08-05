# FINAL RECEIPT

## 最終受入一覧

| 受入項目 | 成果物 | 検証結果 |
|---|---|---|
| API の料金条件を公式資料で確認する | `investigation_report.md`、公式料金ページ、公式 Rate Limit 資料 | 合格。API の追加契約は確認されず、Free と Paid のレート制限が確認できた |
| API Key 発行場所と権限条件を確認する | `investigation_report.md`、Backlog 公式 API 設定ヘルプ、保存設定を使用した本人確認 | 合格。個人設定で発行済みの API Key を OneOps へ設定し、本人確認と目標プロジェクト取得に成功 |
| OneOps の実際の API 呼び出しと必要権限を確認する | `evidence_index.md`、`app/gateway/personal-task-connectors.mjs` | 合格。読み取り API とプロジェクト参加条件を確認した |
| 実装テストを実行する | `test_results.md` | 合格。13 件中 13 件成功 |
| 秘密情報を外部へ送信しない | `commands.md` | 合格。API Key、パスワード及びセッション情報の値を記録していない |
| 会社スペースの現行状態を確定する | 会社ログイン後の OneOps 設定、本人確認、プロジェクト一覧及びテンプレート保存 | 合格。目標三プロジェクトを取得し、三テンプレートを保存 |

## 回付

API は Backlog の Free と Paid の双方で利用され、API 専用の追加契約は公式資料から確認されていない。今回の API Key は有効で、OneOps の読み取り用途に必要な目標プロジェクトを取得できた。`all=true` の 403 は、スペース全体管理者権限とプロジェクト利用権限を分けて扱う根拠として記録する。

本調査では Backlog の契約変更を実施していない。OneOps ではユーザーが発行した API Key を設定し、接続及びテンプレート保存を実施した。
