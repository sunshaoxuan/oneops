# 実行コマンド

```text
pnpm --filter @one-ops/portal-shell test --run
pnpm --filter @one-ops/portal-shell build
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/publish-portal.ps1 -Reason portal-secondary-heading
Browser: http://127.0.0.1:5188/system-management/users の DOM、computed style、Console、Screenshot を確認
Browser viewport: 640x900 の横方向溢れと Console を確認
git diff --check
```

正式 HTTPS は `https://192.168.20.54/system-management/users` で認証待ちとなった。認証情報は入力していない。
