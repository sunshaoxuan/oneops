# 验证命令

```powershell
& ..\runtime\node\pnpm.cmd check
```

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass `
  -File D:\nginx\app\scripts\publish-portal.ps1 `
  -AppRoot D:\nginx\app `
  -SkipChecks `
  -Reason inquiry-ai-analysis-modes-v0.2.6
```

```powershell
git diff --check
```

浏览器验证使用已认证的 OneOps 会话完成，操作顺序为查询工单、打开详情、确认未自动调用 AI、人工点击问题块入口或消息灯泡、等待任务完成、检查结果视图与控制台。

