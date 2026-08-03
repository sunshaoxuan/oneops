# 代理ログイン後の環境白画面調査

## 結論

Spring 移行後の環境インベントリ API が、従来の直下応答を `inventory` で包装していました。Portal は従来契約の `summary` を直下から参照するため、HTTP 200 の後に React 実行時例外が発生していました。

## 事象の経路

1. 管理者が閲覧者へ代理ログインします。
2. Portal は `GET /api/work-center/v1/organizations/{id}/environment-inventory` を実行します。
3. Spring は `{"inventory":{"organizationId":...,"summary":...}}` を返していました。
4. Portal は `data.summary.total` を参照し、`summary` が存在しないため描画を中断していました。

## 修正

- Spring Controller を既存契約の直下応答へ戻しました。
- 認証利用者または代理実行者が変わった場合、認証済み Portal を再構築します。
- 環境の配列項目を描画前に検証し、API 失敗時は再読込可能な Alert を表示します。

## 検証範囲

- 正式 PostgreSQL に作成した一時利用者と一時ロールで代理ログインを実行しました。
- 閲覧者セッションの `environments.read` と `environments.write` 不保持を確認しました。
- 環境インベントリ API の直下契約と、環境更新 API の 403 を確認しました。
- 試験データはトランザクションで自動ロールバックしました。
