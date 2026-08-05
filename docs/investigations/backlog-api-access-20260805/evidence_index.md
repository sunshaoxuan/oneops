# Backlog API 調査証拠索引

| 主張 | 証拠 | 確度 | 制限 |
|---|---|---|---|
| Backlog API は Free と Paid の双方にレート制限が定義されている | Nulab 公式 Developer API の Rate Limit | 高 | API の実効値は対象スペースの API 応答で確認する必要がある |
| Backlog にフリープランが存在する | Backlog 公式料金ページ | 高 | `nisshin30` の契約プランは未確認 |
| API Key は個人設定 > API から発行する | Backlog 公式 API 設定ヘルプ、ユーザーからの発行済み報告 | 高 | 個人設定画面自体のスクリーンショットは保存していない |
| API Key は発行ユーザーの API 認証に使われる | Nulab 公式 API 認証資料、OneOps 保存設定での本人確認 | 高 | API Key の値は記録していない |
| `/users/myself` はすべての権限で実行可能 | Nulab 公式 API リファレンス | 高 | API Key の発行可否とは別の判定 |
| `/projects` は通常参加プロジェクトだけを返す | Nulab 公式 API リファレンス | 高 | 管理者の `all=true` は OneOps が使用しない |
| `/issues` は参加プロジェクトから取得する | Nulab 公式 API リファレンス | 高 | 対象課題の閲覧範囲は実ユーザーの参加状態に依存 |
| OneOps は API Key を使って読み取り処理を行う | `app/gateway/personal-task-connectors.mjs`、`app/gateway/external-task-settings.mjs`、認証後の実 API 応答 | 高 | レート制限の実効値は未取得 |
| OneOps の Backlog 関連テストは成功している | `node --test app/gateway/personal-task.test.mjs app/gateway/external-task-settings.test.mjs` | 高 | モック応答によるテスト |
| 目標三プロジェクトを現在の API Key で取得できる | 認証後 `/api/v2/projects` の 11 件、`TS2_ITS`、`TECH_SUPPORT`、`OHR_TOKYO` | 高 | API Key 所有ユーザーの可視範囲に依存 |
| `all=true` は現在の応答で 403 | 認証後 `/api/v2/projects?all=true` の読み取り確認 | 高 | スペース全体管理者権限の追加確認が必要 |
