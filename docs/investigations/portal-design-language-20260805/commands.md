# 実行コマンド記録

作業ディレクトリは `D:\nginx` である。

| 用途 | 実行内容 | 結果 |
|---|---|---|
| 基準確認 | `git fetch origin master`、`git status --short` | 正式リモートを確認し、既存の未コミット変更を識別 |
| Portal 単体試験 | `D:\nginx\runtime\node\pnpm.cmd --filter @one-ops/portal-shell test` | 17 ファイル、142 テスト合格 |
| 全プロジェクト試験 | `D:\nginx\runtime\node\pnpm.cmd test` | Node 173、Python 14、Portal 142 合格 |
| Portal 本番ビルド | `D:\nginx\runtime\node\pnpm.cmd build` | TypeScript と Vite ビルド成功 |
| 静的配信 | `powershell.exe -NoProfile -ExecutionPolicy Bypass -File D:\nginx\app\scripts\publish-portal.ps1 -SkipChecks -SkipGatewayRestart -Reason portal-design-language-20260805` | 配信成功、Gateway 再起動なし |
| Gateway Health | `Invoke-RestMethod http://127.0.0.1:8092/api/work-center/v1/health` | `status=UP` |
| HTTPS 確認 | `Invoke-WebRequest -UseBasicParsing -SkipCertificateCheck https://192.168.20.54/` | `status=200` |
| ブラウザー確認 | 正式 HTTPS 入口で顧客情報、個人タスク、システム管理を表示 | スクリーンショット、DOM、コンソールを確認 |
