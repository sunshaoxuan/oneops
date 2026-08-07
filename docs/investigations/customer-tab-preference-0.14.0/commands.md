# 実行 Command

## Repository

```powershell
git fetch origin master --tags
git diff --check
git status --short
git rev-parse HEAD
git rev-parse origin/master
```

## Test

```powershell
D:\nginx\runtime\node\pnpm.cmd --dir app check
D:\nginx\app\backend\mvnw.cmd test
D:\nginx\runtime\node\pnpm.cmd --dir app test:operations
```

## Runtime

```powershell
curl.exe -k -sS https://192.168.20.54/api/work-center/v1/health
curl.exe -k -sS https://192.168.20.54/
Get-FileHash D:\nginx\app\apps\portal-shell\dist\index.html,D:\nginx\html\index.html -Algorithm SHA256
```

## Browser

正式画面で Tab の並べ替え、非表示、再読込、選択中 Tab の非表示、最低表示数、既定復元、Desktop、390px Narrow View、Console を確認した。
