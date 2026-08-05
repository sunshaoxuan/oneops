# 実行コマンド

## 調査

```text
Backlog API projects
Backlog API projects/155893/customFields
Backlog API projects/155379/customFields
Backlog API issues/count と issues の customField 条件
```

## 実装確認

```text
git fetch origin master
node --check gateway/external-task-settings.mjs
node --check gateway/inquiry-support-routes.mjs
node --check gateway/customer-information-routes.mjs
node --test gateway/*.test.mjs
vitest run
tsc -b apps/portal-shell/tsconfig.json
vite build
```

## 実データ確認

```text
Migration 029 を本機 PostgreSQL へ適用
BacklogSystemSourceClient.listIssuesByTemplates を TS2_ITS と TECH_SUPPORT で実行
```

API Key、パスワード及び認証情報の値は記録していない。

## 認証後ブラウザー受入

```text
OneOps 保存済みユーザー名及びパスワードによる認証後セッションを確認
https://192.168.20.54/system-management/inquiry-support を表示
テンプレート追加ダイアログで OHR_TOKYO を選択
プロジェクト項目取得結果が自動属性なしであることを確認
「件名、タイトルに顧客名を含む」を選択
OHR_TOKYO + 件名を保存
テンプレート表で TS2_ITS、TECH_SUPPORT、OHR_TOKYO の三件を確認
顧客情報で 0220 一橋大学を選択し、関連タスク及びチケットを表示
共通列の 23 課題を 20 件と 3 件のページで確認
件名列の既定昇順、件名見出しによる降順切替及び再度の昇順切替を確認
第 1 ページ 20 件、第 2 ページ 3 件及び課題 Key 23 件の一意性を確認
顧客情報で ONEHR OneHR株式会社を選択し、該当課題なしを確認
ブラウザーコンソールの warning/error を確認: なし
```

認証後ブラウザーのスクリーンショットは受入時に取得した。API Key、パスワード及び認証情報の値は記録していない。

## 件名ソート配信

```text
publish-portal.ps1 -Reason backlog-title-sort
Gateway、Portal、Backend の全テストとビルドに成功
Nginx 設定検査に成功
Nginx reload が Access is denied を返し、ローリング配信はロールバックされ、主サービス 8092 を維持
publish-portal.ps1 -SkipChecks -SkipRuntimeValidation -SkipGatewayRestart -Reason backlog-title-sort-ui
静的 Portal 配信に成功
Health 8092、8093 は UP
ブラウザーで件名昇降順、跨頁及び Console の受入に成功
```

## Backlog API 範囲調査

```text
Backlog 公式 Get Project List 仕様を確認
Backlog 公式 Authentication & Authorization 仕様を確認
現行 listProjects() の API 呼び出しを確認: /api/v2/projects、all パラメーターなし
認証後の `/api/v2/projects` で 11 件を取得し、TS2_ITS、TECH_SUPPORT、OHR_TOKYO を確認
認証後の `/api/v2/projects?all=true` は 403
```

公式仕様では、管理者だけが `all=true` で全プロジェクトを取得できる。今回の API Key に対する `/api/v2/projects?all=true` は 403 であり、参加済みプロジェクトの利用確認とスペース全体管理者権限の確認は分けて扱う。
