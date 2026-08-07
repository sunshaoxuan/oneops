# 実行コマンド記録

作業ディレクトリは D:\nginx。秘密情報、Cookie、認証値は記録していない。

## 事前確認

git status --short
git branch --show-current
git rev-parse HEAD
git rev-parse origin/master
rg -n "role_id|roles.*code|updateRole|/roles/" app/backend app/apps/portal-shell/src app/gateway

事前確認時点でブランチは master、ローカル HEAD と origin/master は一致していた。既存の顧客情報、SSO および証拠ファイルの未コミット変更は本作業の範囲外として保持した。

## 自動検証

D:\nginx\runtime\node\pnpm.cmd test
D:\nginx\runtime\node\pnpm.cmd build
./mvnw.cmd test
git diff --check

最初に PATH 上の pnpm を実行したところ、キャッシュ runtime の pnpm.mjs が存在せず起動前に失敗した。その後、リポジトリ内蔵の D:\nginx\runtime\node\pnpm.cmd へ切り替えて同じ試験を完了した。Gateway 205 件、Portal 157 件、Builder 14 件、Spring Backend 33 件を確認した。Spring のデータベース統合試験 7 件は ONEOPS_DATABASE_INTEGRATION_TEST 未設定時の設計どおり Skip である。Production Build は Portal と Spring の双方で成功した。

## 配信と実行時確認

publish-portal.ps1 の本番配信処理
nginx -t 相当の設定検査
https://192.168.20.54/system-management/roles

配信ログで delivery_started と delivery_succeeded を確認した。正式画面では OPERATOR の編集ドロワーを開き、Code、Name、Description、権限マトリクスを確認した。ブラウザー Console の warning と error は 0 件で、画面証拠は docs/evidence/role-edit-physical-id-20260807.png に保存した。

## ブラウザー終了処理

browser.tabs.finalize({ keep: [] })

実ブラウザーの一時タブは最終確認後に閉じた。
