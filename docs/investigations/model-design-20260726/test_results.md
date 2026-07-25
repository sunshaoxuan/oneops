# 测试结果

## 已完成

1. 后端聚焦测试：17 项通过。
2. 后端 Node 全量测试：84 项通过。
3. Worker Python 测试：4 项通过。
4. 前端测试：45 项通过。
5. 前端生产构建：通过。
6. 正式发布脚本、Nginx 配置、网关健康和 HTTPS 检查：通过。
7. 数据库存在 `ai_model_settings`；`models.settings.read` 和 `models.settings.write` 只授予 `SYSTEM_ADMIN`；生产配置记录数为 0。
8. 浏览器显示模型设计与 API 设置；提供方列表只有 OpenAI；API Key 为密码输入；虚构连接测试显示成功；控制台警告和错误为 0。
9. 1280 像素视口下，管理内容区宽 955 像素，模型设计页与设置卡片宽 907 像素，正好覆盖扣除内容区左右内边距后的全部可用宽度；页面、卡片和表单的 `max-width` 均为 `none`。
10. 表单在桌面宽度下按约 261/620 像素双栏展开；响应式单栏规则由前端测试覆盖。
11. 截图：`D:\nginx\docs\evidence\model-design-openai-settings-20260726.png`。

## 测试边界

没有真实 API Key。后端使用本地 HTTP 桩，浏览器使用生产构建产物与临时本机 API 桩。临时服务和目录已删除。
