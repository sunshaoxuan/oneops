# 产品构筑功能需求

更新时间：2026-07-24

## 功能边界

1. 原 One構築 主控台迁入 `D:\nginx\app\builder`，成为 OneOps 的“製品構築”子功能。
2. 浏览器只访问 OneOps 的 HTTPS 入口。产品构筑页面、API、历史、日志和成果物下载统一使用 `/api/work-center/v1/builder/`。
3. OneOps 网关通过标准输入输出协议管理内部 Python worker。worker 不建立 TCP 监听，不使用原 `8091` 端口。
4. 构建终端继续作为远端执行节点。其页面和 API 通过 OneOps 同源路径代理，浏览器不直接访问构建终端端口。
5. 原构筑器的标准版、NHO版、标准发版、机构封包、客户化、历史、日志、停止、删除、成果物检查和下载契约保持不变。

## 共通コンテキスト

1. 用户进入“製品構築”时，OneOps 将共通コンテキスト当前组织机构的 `name` 写入构筑器 `organisation_name` 字段。
2. 传递值使用组织机构档案的业务名称。组织机构物理 ID 继续留在 OneOps 数据模型中，普通构筑画面不显示物理 ID。
3. 机关名称只执行初始填充。输入框保持可编辑，用户可以按本次交付需要手工修改。
4. 共通コンテキスト切换组织机构后，构筑画面使用新机关名称重新初始化。
5. 查看历史任务时，画面显示该历史任务保存的机关名称，避免用当前上下文覆盖历史事实。

## 运行与数据

1. 源码位于 `D:\nginx\app\builder`。
2. Python 运行时位于 `D:\nginx\runtime\python`。
3. 固定模板、SQL 模板、中间件缓存和数据连携缓存位于 `D:\nginx\app\builder\.standalone-template`。
4. 构筑历史位于 `D:\nginx\app\builder-data\standalone-builds`。
5. 正式交付结果位于 `D:\nginx\app\builder-data\deliveries`。
6. 本机凭据文件保存在 `D:\nginx\app\builder\vm-access.env` 和 `git-access.env`，两者禁止进入版本管理。
7. 历史数据使用 `scripts\migrate-onebuild-data.ps1` 从原目录迁移。迁移前必须确认没有等待中或运行中的任务。

## 验收

1. `8091` 不存在监听。
2. OneOps 网关 `127.0.0.1:8092` 和 Nginx `443` 保持原入口。
3. OneOps 的“製品構築”菜单显示完整构筑器。
4. 构筑器机关名称等于共通コンテキスト所选机关名称。
5. 机关名称输入框可以手工修改。
6. 原 13 条成功任务和既有交付目录仍可读取。
7. 构筑器、网关、前端单元测试和生产构建通过。
8. 发布页面完成浏览器画面、控制台和截图检查。
