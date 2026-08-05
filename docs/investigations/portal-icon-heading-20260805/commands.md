# 実行コマンド

## テストとビルド

```text
D:\nginx\runtime\node\pnpm.cmd --filter @one-ops/portal-shell test
D:\nginx\runtime\node\pnpm.cmd test
D:\nginx\runtime\node\pnpm.cmd build
```

最初にリポジトリ直下で実行した Portal テストは、直下に `package.json` がないため開始できなかった。実際の pnpm ワークスペースは `D:\nginx\app` にあるため、作業ディレクトリを修正して再実行した。

## 公開

```text
powershell.exe -NoProfile -ExecutionPolicy Bypass -File D:\nginx\app\scripts\publish-portal.ps1 -SkipChecks -SkipGatewayRestart -Reason portal-icon-heading-20260805
```

## 実ページ確認

対象は `https://192.168.20.54/` から遷移した次の画面である。

1. `/customers`
2. `/personal-tasks`
3. `/system-management/model-api`
4. `/system-management/agent-gateways`
5. `/system-management/inquiry-support`
6. `/system-management/inquiry-search-templates`
7. `/system-management/workforce`
8. `/master-data/organizations`
9. `/master-data/organization-classifications`
10. `/master-data/product-versions`
11. `/inquiry-support`

各画面で DOM の見出し、アイコン寸法、`document.body.clientWidth`、`document.body.scrollWidth` とブラウザーの warning、error を確認した。640px の狭い画面では顧客情報と Agent Gateway を再確認し、最後に既定のデスクトップ視口へ戻した。
