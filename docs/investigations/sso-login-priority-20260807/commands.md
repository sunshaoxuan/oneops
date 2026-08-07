# コマンド記録

| 用途 | コマンドまたは操作 |
| --- | --- |
| 設定 API 確認 | `Invoke-RestMethod http://127.0.0.1:8092/api/work-center/v1/auth/config` |
| SSO 到達性確認 | `Test-NetConnection OHR0067 -Port 8998`、SSO URL の匿名 HTTP 取得 |
| プロファイル確認 | `Invoke-WebRequest http://192.168.20.38:8999/auth_windows.jsp` |
| スクリプト自己検査 | `powershell.exe -NoProfile -ExecutionPolicy Bypass -File app/scripts/ensure-oneops-runtime.ps1 -SelfTest` |
| ブラウザー確認 | SSO 優先待機、失敗後ローカルフォーム、SSO ボタン、コンソール、スクリーンショット |
| 運用スクリプト検査 | `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/test-operations-scripts.ps1` |
| Gateway テスト | `D:\nginx\runtime\node\node.exe --test gateway/*.test.mjs` |
| Builder テスト | `D:\nginx\runtime\python\python.exe -m unittest builder/oneops_worker_test.py` |
| Portal テスト | `D:\nginx\runtime\node\pnpm.cmd --filter @one-ops/portal-shell test` |
| Portal ビルド | `D:\nginx\runtime\node\pnpm.cmd --filter @one-ops/portal-shell build` |
| 実行時一回巡検 | `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/ensure-oneops-runtime.ps1 -SkipDockerDesktopLaunch` |
| 隔離 SSO 代理 | タスク専用一時ディレクトリの短命 Node 代理。Portal は 5174 へ転送し、認証設定だけを SSO 有効値へ置換。検証後にプロセスと一時ディレクトリを削除 |

最初に `app` を作業ディレクトリにした状態で `app/scripts/test-operations-scripts.ps1` を指定して失敗した。正しい作業ディレクトリと相対パスへ修正して再実行し、合格結果を採用した。
