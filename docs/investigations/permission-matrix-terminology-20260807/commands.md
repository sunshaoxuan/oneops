# 実行コマンド

```powershell
git status --short
git fetch origin master
git rev-parse HEAD
git rev-parse origin/master
..\runtime\node\pnpm.cmd --filter @one-ops/portal-shell test --runInBand
..\runtime\node\pnpm.cmd --filter @one-ops/portal-shell test
..\runtime\node\pnpm.cmd --filter @one-ops/portal-shell build
powershell.exe -NoProfile -ExecutionPolicy Bypass -File app\scripts\publish-portal.ps1 -Reason permission-matrix-terminology
git diff --check
```

最初の Vitest コマンドは `--runInBand` が未対応のため失敗した。その後、プロジェクトの `test` スクリプトを実行し、Portal Shell の全試験を完了した。正式 HTTPS 入口 `https://192.168.20.54/system-management/roles` を認証済みブラウザーで開き、SYSTEM_ADMIN のロール編集画面を表示した。ブラウザーでは DOM、寸法、Console、スクリーンショットを確認し、保存用権限 Code を送信する操作は実行していない。

## 2026-08-10 追加コマンド

```powershell
git fetch origin master
..\runtime\node\pnpm.cmd --filter @one-ops/portal-shell test -- permission-matrix.test.ts auth-ui.test.ts
..\runtime\node\pnpm.cmd --filter @one-ops/portal-shell test
..\runtime\node\pnpm.cmd --filter @one-ops/portal-shell build
powershell.exe -NoProfile -ExecutionPolicy Bypass -File app\scripts\publish-portal.ps1 -Reason permission-resource-i18n-20260810 -SkipGatewayRestart
powershell.exe -NoProfile -ExecutionPolicy Bypass -File app\scripts\publish-portal.ps1 -Reason permission-resource-i18n-20260810-static-validation -SkipChecks -SkipGatewayRestart
```

最初の配信試験は全量 `pnpm check` 内の既存モデル設定試験で停止した。その後、Portal 専用試験と本番ビルドを確認し、静的配信だけを実施した。Browser は正式 HTTPS 入口の未認証ログイン画面で停止し、SSO ボタンと Console を確認した。権限マトリクスの実データ表示は認証済み Browser の不足により `evidence_missing` とした。
