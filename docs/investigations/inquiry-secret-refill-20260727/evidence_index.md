# 证据索引

| 结论 | 证据 | 可信度 | 限制 |
|---|---|---:|---|
| 密码以 AES-GCM 加密保存 | `app/gateway/inquiry-support-database.mjs`、`credential-crypto.mjs` | 高 | 无 |
| 设置接口完整回填密码 | `app/gateway/inquiry-support-routes.mjs` 与新增网关测试 | 高 | 仅系统管理员设置接口 |
| 默认掩码且可显示和复制 | `SecretInput.tsx`、前端测试、真实浏览器控件状态 | 高 | 剪贴板内容未读取 |
| API Key 与 Token 使用相同控件 | `ModelDesignPage.tsx` | 高 | 无 |
| 生产页面无控制台错误 | 浏览器 `error`、`warn` 日志为空 | 高 | 验收时间为 2026-07-27 |
| 截图不包含凭据原文 | `docs/evidence/inquiry-password-refill-copy-20260727.jpg` | 高 | 仅展示日文桌面布局 |
