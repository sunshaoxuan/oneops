# OneOps 模型设计完成回执

## 交付

OneOps 系统管理已经增加“模型设计”。当前提供方只有 OpenAI，可配置兼容 API Endpoint、模型和 API Key，并可在保存前执行连接测试。

API Key 使用服务器端认证加密保存，系统管理员读取设置时会解密并完整回填到关闭明文显示切换的密码输入框。保存与测试受系统管理员权限、CSRF 和审计控制。

## 验证

1. 后端 Node 测试：85 项通过。
2. Worker Python 测试：4 项通过。
3. 前端测试：46 项通过。
4. TypeScript 与 Vite 生产构建：通过。
5. 正式发布脚本：通过。
6. Nginx 配置检查：通过。
7. 网关健康与 HTTPS 页面检查：通过。
8. 数据库迁移：`ai_model_settings`、两项模型权限与 SYSTEM_ADMIN 授权已确认。
9. 浏览器：OpenAI 唯一选项、密码输入、连接成功提示与无控制台错误已确认。
10. 模型设计页与设置卡片已使用管理工作区扣除内边距后的全部可用宽度；桌面双栏和窄屏单栏布局已验证。
11. 卡片底部操作区已按 OneOps 编辑操作习惯右对齐，“测试连接”位于辅助动作位置，“保存设置”位于最右侧主动作位置。
12. 浏览器确认完整 API Key 回填到密码输入框，明文显示切换关闭，保存与测试均提交完整值，保存后继续完整回填。

## 测试边界

开发与浏览器自动化使用本地 HTTP 桩和虚构密钥。生产数据库当前已有管理员保存的一条加密模型设置记录；验证过程没有输出或记录 API Key 明文。

## 证据

1. `D:\nginx\docs\evidence\model-design-openai-settings-20260726.png`
2. `D:\nginx\docs\investigations\model-design-20260726\test_results.md`
3. `D:\nginx\app\logs\continuous-delivery.log`
