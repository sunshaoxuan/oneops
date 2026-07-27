# 证据索引

| 结论 | 证据 | 可信度 | 限制 |
|---|---|---|---|
| 外层选择器清空全部嵌套卡片内边距 | `app/apps/portal-shell/src/styles.css` 与发布前浏览器计算样式 | 高 | 适用于系统管理和基本台账外壳 |
| 发布前模型、问合和用户卡片 Body Padding 均为 0 | 浏览器测量 | 高 | 测量视口为 1265px |
| 发布后管理嵌套卡片 Body Padding 均为 24px | Model API、问合设置、用户管理和基本台账浏览器测量 | 高 | 桌面视口 |
| 两张模型卡片 Footer 高度、右侧和底部间距一致 | 浏览器测量：Footer 61px，右侧和底部边距均为 25px | 高 | 25px 包含 1px 卡片边框 |
| 问合设置复用相同 Footer 规则 | `InquirySupportSettingsPage.tsx` 与浏览器测量 | 高 | 无更新时间元数据 |
| 页面无横向溢出且控制台为空 | 四类页面浏览器检查 | 高 | 窄屏由样式契约测试覆盖 |
| 视觉结果 | `docs/evidence/ui-spacing-model-cards-20260727.png`、`ui-spacing-standard-inquiry-settings-20260727.png` | 高 | 日文桌面画面 |
