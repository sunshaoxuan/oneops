# Backlog API 調査テスト結果

実行日時: 2026-08-05

## 実行コマンド

`& 'D:\nginx\runtime\node\node.exe' --test app/gateway/personal-task.test.mjs app/gateway/external-task-settings.test.mjs`

## 結果

1. テスト数: 13
2. 成功: 13
3. 失敗: 0
4. キャンセル: 0
5. スキップ: 0

## 実スペース照合

1. `/api/v2/users/myself`: 成功。本人確認済み。
2. `/api/v2/projects`: 成功。11 件を取得し、`TS2_ITS`、`TECH_SUPPORT`、`OHR_TOKYO` を確認。
3. `/api/v2/projects?all=true`: 403。通常のプロジェクト利用権限とは別に記録。
4. 三テンプレート保存: 成功。自動属性二件と件名照合一件を保存。

## 確認できた実装契約

1. Backlog URL の HTTPS と許可ホスト検証
2. API Key による `users/myself` 認証
3. 本人、プロジェクト、状態、更新日による担当課題取得
4. 401、403、429、タイムアウトのエラー分類
5. 429 発生時の一度だけの再試行
