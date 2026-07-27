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
