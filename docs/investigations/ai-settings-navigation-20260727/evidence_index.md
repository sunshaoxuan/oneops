# 证据索引

| 结论 | 证据 | 可信度 | 限制 |
|---|---|---|---|
| AI 设置组包含两个独立功能键 | `app/apps/portal-shell/src/App.tsx` | 高 | 只适用于当前系统管理前端 |
| 内容区不再使用 Tabs | `app/apps/portal-shell/src/ModelDesignPage.tsx`、`model-design.test.ts` | 高 | 页面仍共用设置查询接口 |
| 功能名称固定为 Model API 与 Agent Gateways | `app/apps/portal-shell/src/i18n.ts`、`i18n.test.ts` | 高 | 三种语言使用相同产品功能名 |
| 需求文档已记录导航层级 | `docs/AI_SETTINGS_REQUIREMENTS.md` | 高 | 无 |
| 已发布页面能切换两个功能且页签数为 0 | 2026-07-27 浏览器 DOM 与截图检查 | 高 | 截图在浏览器验收会话中查看 |
| 720 像素宽度没有横向溢出 | 浏览器测量 `innerWidth=720`、`scrollWidth=705` | 高 | 只覆盖本次相关断点 |
| 控制台没有错误或警告 | 浏览器日志检查返回空数组 | 高 | 覆盖本次页面访问与切换过程 |
