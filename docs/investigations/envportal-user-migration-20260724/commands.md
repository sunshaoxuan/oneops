# 执行命令

## 预演

```powershell
pnpm import:envportal-users -- --dry-run --source-root "\\192.168.20.38\C$\workspace\envPortal" --output-dir "D:\nginx\backups\identity-migrations\2026-07-24-envportal-users"
```

## 执行

```powershell
pnpm import:envportal-users -- --apply --source-root "\\192.168.20.38\C$\workspace\envPortal" --output-dir "D:\nginx\backups\identity-migrations\2026-07-24-envportal-users"
```

## 验证

```powershell
pnpm check
pnpm test:operations
```
