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

附件解析与 OCR 验证：

```powershell
D:\nginx\runtime\node\node.exe --test gateway/inquiry-support.test.mjs gateway/operation-audit.test.mjs
D:\nginx\runtime\node\pnpm.cmd check
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/publish-portal.ps1 -SkipChecks -Reason inquiry-attachment-ocr-20260727
docker exec onehr-operations-postgres psql -U onehr_ops -d onehr_operations -tAc "SELECT COUNT(*) FROM inquiry_assist_runs WHERE ticket_no = '38950';"
Invoke-RestMethod -Uri http://127.0.0.1:8092/api/work-center/v1/health
```

浏览器打开真实工单 38950，检查两份扫描 PDF 的 `解析済み` 状态、默认收起的解析正文、页码标记、正文长度和 `pre-wrap` 计算样式。重新打开详情前后辅助任务数均为 2，并检查浏览器开发日志。截图仅裁切解析状态标签，避免客户信息和附件名称进入版本库。
