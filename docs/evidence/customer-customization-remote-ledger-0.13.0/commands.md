# Verification commands

Run from `D:\nginx\app`:

```powershell
..\runtime\node\pnpm.cmd check
```

Run from `D:\nginx`:

```powershell
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:8092/api/work-center/v1/health
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:8093/api/work-center/v1/health
rg -n "0408|筑波大学|筑波大" app/gateway app/apps app/packages app/backend
Get-Content app\logs\continuous-delivery.log -Tail 120
git diff --check
git status --short
```

Browser acceptance used the signed in OneOps page, tab role locators, viewport screenshots and Console error and warning inspection. No credential value is present in this command record.
