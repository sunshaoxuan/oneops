# 验证结果

日期：2026-07-27

## 自动化

1. 网关测试：91 项通过。
2. Worker 测试：4 项通过。
3. 前端测试：48 项通过。
4. TypeScript 编译通过。
5. Vite 生产构建通过。
6. Nginx 配置检查通过。
7. 发布后的网关健康检查与 HTTPS 检查通过。

## 数据库

1. `ai_model_settings.purpose` 已迁移，现有记录为 `GENERAL`。
2. `agent_gateway_settings` 表已创建。
3. 临时浏览器验收用户清理后数量为 0。
4. 临时 Agent Gateway 设置清理后数量为 0。

## 浏览器

1. 系统管理菜单与页面标题显示“AI設定”。
2. 页面包含“モデル API”与“Agent Gateway”标签。
3. 通用任务模型与简单任务模型分别显示。
4. 通用任务模型的完整 API Key 回填到 `password` 输入框，截图中仅显示密码字符。
5. 两张模型卡片宽 796 像素，页面宽 796 像素，覆盖管理内容区扣除 48 像素左右内边距后的全部可用宽度。
6. 每张模型卡片的测试按钮位于保存按钮左侧，保存按钮位于右端。
7. Agent Gateway 新增画面包含名称、API Endpoint、可选 Access Token、启用状态、测试与保存。
8. 使用 `http://127.0.0.1:8000/api/v1` 测试本机 CAG 成功，返回 1 个项目。
9. 临时 Access Token 保存后由数据库重新读取，输入框类型为 `password`，回填长度为 24。
10. Agent Gateway 操作区使用 `flex-end`，按钮顺序为测试、保存。
11. 浏览器控制台 warning 与 error 数量为 0。

## 截图

1. `docs/evidence/ai-settings-model-api-20260727.png`
2. `docs/evidence/ai-settings-agent-gateway-20260727.png`
