# Backlog API 調査コマンド

調査記録には API Key、パスワード、セッション情報の値を保存していない。OneOps の保存済み設定を使った API 接続確認とプロジェクト取得は実施した。

1. 公式情報の検索
   `web search` で Backlog 公式料金ページ、Nulab Developer API、Backlog ヘルプセンターを検索した。
2. 料金と API 認証の確認
   Backlog 公式料金ページ、API 認証資料、API 設定ヘルプ、レート制限資料を開いた。
3. OneOps 実装の確認
   `rg` で `BacklogTaskConnector`、`/api/v2`、`users/myself`、`issues`、`projects` を検索した。
4. OneOps テストの実行
   `& 'D:\nginx\runtime\node\node.exe' --test app/gateway/personal-task.test.mjs app/gateway/external-task-settings.test.mjs`
5. 実スペース照合
   OneOps 保存設定から `/api/v2/users/myself`、`/api/v2/projects`、プロジェクト自動属性取得及びテンプレート保存を確認した。
6. 管理者範囲照合
   `/api/v2/projects?all=true` を読み取り専用で確認し、403 を記録した。
7. 秘密情報の取扱い
   API Key、パスワード及びセッション情報の値は出力、文書化、コミットしていない。
