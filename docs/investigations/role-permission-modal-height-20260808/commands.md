# 実行コマンド

```powershell
git fetch origin master
& D:\nginx\runtime\node\pnpm.cmd --filter @one-ops/portal-shell test
& D:\nginx\runtime\node\pnpm.cmd --filter @one-ops/portal-shell build
& D:\nginx\runtime\node\pnpm.cmd check
& C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/publish-portal.ps1 -Reason role-permission-modal-height-20260808-republish
Invoke-RestMethod http://127.0.0.1:8092/api/work-center/v1/health
curl.exe -k --connect-timeout 5 --max-time 10 -f -sS -o NUL -w "https_status=%{http_code}`n" https://192.168.20.54/
```

## 失敗した呼び出し

`D:\nginx\runtime\powershell\pwsh.exe` は存在しなかったため、最初の公開呼び出しは起動前に終了した。システム PowerShell へ切り替えた後、公開スクリプトは成功した。

## ブラウザー確認

IAB で `https://192.168.20.54/` のログイン画面を確認し、Windows SSO ボタンが表示されることを確認した。SSO 押下後の認証先は Browser Use URL ポリシーによりブロックされた。Edge の既存認証候補は `ohr0067:8998` の `ERR_BLOCKED_BY_CLIENT` だった。認証情報の入力、Cookie・Storage の読み取り、認証迂回は行っていない。
