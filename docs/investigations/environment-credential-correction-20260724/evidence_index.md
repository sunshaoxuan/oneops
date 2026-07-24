# 证据索引

| 结论 | 证据 | 结果 |
|---|---|---|
| EnvPortal 保存应用与 DB 凭据 | `D:\workspace\envPortal\data.csv` 字段结构 | 4 个已匹配环境各有 4 个凭据字段 |
| EnvPortal 保存 RDP 凭据 | `D:\workspace\envPortal\rdp.csv` 字段结构 | 3 条记录，1 条匹配现有客户环境 |
| UHR 属于 U-HR | `D:\nginx\refs\★各機関情報一覧_20250530_サポート確認.xlsx` 与 U-HR 模块版数目录截图 | 4 个环境形成 U-HR 候选 |
| 产品档案与凭据导入结果 | `D:\nginx\docs\evidence\envportal-product-credential-correction-20260724.json` | 批次 3，4 个环境增强，18 个凭据字段进入导入计划 |
| 密文可以正确恢复源值 | 专项验证脚本逐项比对源文件与数据库解密结果 | 9 组全部一致，密文明文泄漏 0 |
| 运行页面具备端点与凭据操作 | 已发布页面的筑波大学 UHR“サーバー・接続”页签 | AP 与 DB 均显示凭据已登记，可新增连接、编辑、查看与复制 |
| 凭据操作进入审计 | PostgreSQL `auth_audit_events` | 已记录查看与修改事件，详情不含秘密值 |
| 浏览器运行状态 | 浏览器 DOM 与控制台检查 | 控制台错误和警告 0 |

## 截图限制

浏览器页面与遮罩状态已经完成交互检查。内置页面截图连续两次在 `Page.captureScreenshot` 超时，系统屏幕捕获也因无有效桌面句柄失败，因此本次没有生成新的 UI 图片文件。截图缺失不影响接口、DOM、控制台、数据库和审计验证结论。
