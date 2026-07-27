# 测试结果

## 自动化与构建

- 网关测试：110 项通过。
- Python Worker 测试：4 项通过。
- 前端测试：69 项通过。
- TypeScript 与 Vite 生产构建：通过。
- NGINX 配置检查：通过。
- `git diff --check`：通过。
- 既有构建体积提醒继续存在。

第一次 `pnpm check` 被执行工具的短超时截断，输出管道关闭后产生 `EPIPE`。使用 120 秒执行时限重新运行后完整通过，正式结果以上述第二次执行为准。

## 发布与浏览器

- 发布任务：`github-master-initial-import-20260727` 成功。
- 侧栏版本：`OneOps v0.2.0`。
- 问合等级：工单详情标题区显示独立徽标。
- 空源值：显示“未設定”。
- 浏览器 console warning：0。
- 浏览器 console error：0。
- 截图只保留版本和徽标区域。
