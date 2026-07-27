# 调查与验证命令

在 `D:\nginx\app` 执行：

```powershell
$env:PATH="D:\nginx\runtime\node;$env:PATH"
..\runtime\node\node.exe --test gateway/inquiry-support.test.mjs gateway/auth.test.mjs
pnpm --filter @one-ops/portal-shell test
pnpm check
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts\publish-portal.ps1 -Reason inquiry-support
```

正文格式与 CLOSED 评价使用已配置的加密账号执行只读结构检查。检查输出限定为：

1. `td.message_body`、`br` 和块级节点数量。
2. 标准化正文是否包含换行。
3. 评价对象、满意度、评论和评价时间是否存在。
4. 抽样工单数量与字段命中数量。

检查输出不包含工单号、客户名称、正文、评价评论、账号、密码、Cookie 或 CSRF Token。

在 `D:\nginx` 执行：

```powershell
.\nginx.exe -t
```

健康检查：

```powershell
Invoke-RestMethod https://localhost/api/work-center/v1/health
```

紧急程度显示与移动端抽屉验证：

```powershell
D:\nginx\runtime\node\node.exe --test gateway/inquiry-support.test.mjs
D:\nginx\runtime\node\pnpm.cmd --filter @one-ops/portal-shell exec vitest run src/inquiry-support.test.ts
D:\nginx\runtime\node\pnpm.cmd check
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/publish-portal.ps1 -SkipChecks -Reason inquiry-urgency-responsive-20260727
```

使用已配置的加密账号只读检查真实详情字段标签。浏览器分别打开标题含“至急”和源紧急度为空的真实工单，只保留脱敏后的徽标局部截图。运行时验证 600 × 800 视口下抽屉边界、文档横向宽度、独立滚动和浏览器开发日志。
