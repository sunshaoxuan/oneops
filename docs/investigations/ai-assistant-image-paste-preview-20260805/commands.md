# 検証コマンド

## 対象試験

```powershell
& 'D:\nginx\runtime\node\pnpm.cmd' --filter @one-ops/portal-shell test
& 'D:\nginx\runtime\node\pnpm.cmd' --filter @one-ops/portal-shell build
```

## 全体試験

```powershell
& 'D:\nginx\runtime\node\pnpm.cmd' check
.\mvnw.cmd test
```

## 配信確認

```powershell
.\nginx.exe -t -p D:\nginx
curl.exe -k -f -sS https://192.168.20.54/api/work-center/v1/health
```

