# 证据索引

日期：2026-07-24

| 证据 | 路径或结果 | 支持结论 |
| --- | --- | --- |
| 需求记录 | `docs\PRODUCT_BUILDER_REQUIREMENTS.md` | 功能边界、共通コンテキスト和验收项 |
| 前端入口 | `app\apps\portal-shell\src\App.tsx` | 组织机构名称进入同源 iframe |
| 网关路由 | `app\gateway\server.mjs` | OneOps 同源 API 和远端终端代理 |
| worker 适配 | `app\gateway\builder-worker.mjs` | 路径映射、资源改写和内部进程协议 |
| 内部 worker | `app\builder\oneops_worker.py` | 无 TCP 监听的 Python 调用入口 |
| 构筑页面 | `app\builder\host_standalone_console.py` | 机关名称初始化和原构筑功能 |
| 数据迁移 | `app\scripts\migrate-onebuild-data.ps1` | 历史与交付目录迁移 |
| 元数据恢复 | `app\scripts\recover-onebuild-metadata.py` | 编码事故后的证据化恢复 |
| 自动测试 | `test_results.md` | 78 个网关测试、4 个 worker 测试、41 个前端测试和 68 个原构筑器回归测试 |
| 页面截图 | `docs\evidence\oneops-product-builder-20260724.png` | OneOps 内嵌页面和“筑波大学”机关名称 |
| 工作区截图 | `docs\evidence\oneops-product-builder-workspace-20260724.png` | 重复区域移除、全宽布局、单层滚动和“一橋大学”机关名称 |
| 元数据备份 | `D:\nginx\backups\onebuild-metadata-encoding-20260724` | 恢复前损坏副本，可审计和回滚 |
| 运行监听 | `443`、`127.0.0.1:8092` | OneOps 入口保留，`8091` 无监听 |
