# 证据索引

| 结论 | 证据 | 可信度 | 限制 |
|---|---|---|---|
| 原布局把 Access Token 放在 261 像素窄列 | 发布前浏览器 DOM 尺寸测量 | 高 | 测量视口为 1265 像素 |
| Endpoint 与 Token 已固定到宽列 | `app/apps/portal-shell/src/ModelDesignPage.tsx`、`styles.css` | 高 | 适用于 Agent Gateway 表单 |
| 900 像素及以下恢复单列 | `app/apps/portal-shell/src/styles.css`、`model-design.test.ts` | 高 | 浏览器会话未提供改变视口尺寸的接口 |
| 修正版没有页面横向溢出 | 发布后浏览器测量 | 高 | 测量视口为 1265 像素 |
| 控制台没有错误或警告 | 发布后浏览器日志检查返回空数组 | 高 | 覆盖本次页面访问与表单展开过程 |
| 修正版视觉结果 | `docs/evidence/agent-gateway-balanced-layout-20260727.png` | 高 | 截图为日文桌面画面 |
