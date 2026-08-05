# 実行コマンド記録

更新日: 2026-08-05

## 事前確認

```powershell
git fetch origin master
git rev-parse HEAD
git rev-parse origin/master
git status --short
```

## 試験及び Build

```powershell
cd D:\nginx\app
pnpm check
```

## 配信確認

```powershell
Copy-Item D:\nginx\app\apps\portal-shell\dist\index.html D:\nginx\html\index.html -Force
Copy-Item D:\nginx\app\apps\portal-shell\dist\assets\* D:\nginx\html\assets -Recurse -Force
D:\nginx\nginx.exe -t -p D:\nginx\ -c conf\nginx.conf
Invoke-WebRequest https://192.168.20.54/ -SkipCertificateCheck
```

## 比較器確認

```powershell
node -e "const codes=['ONEHR','0220','0452','0280','0288','0284']; console.log(codes.sort((a,b)=>a.localeCompare(b,'ja-JP',{numeric:true,sensitivity:'base'})).join(','))"
```
