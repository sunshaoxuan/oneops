# OneOps 产品构筑移植调查报告

日期：2026-07-24

## 结论

原 One構築 已迁入 OneOps，成为“製品構築”子功能。浏览器统一通过 OneOps HTTPS 入口访问。原本机 `8091` 服务已停止并删除，内部 Python worker 通过标准输入输出与 OneOps 网关通信。

共通コンテキスト的组织机构名称按照以下链路进入构筑画面：

1. OneOps 保存共通コンテキスト当前组织机构 Code。
2. 前端从组织机构快照中按 Code 找到档案。
3. 前端读取档案 `name`。
4. `BuilderPage` 将名称写入同源 iframe 的 `organisation_name` 查询参数。
5. 构筑页面脚本读取查询参数。
6. 页面脚本将值写入 `input[name="organisation_name"]`。
7. 输入框保持普通可编辑状态。

浏览器以“筑波大学”验证了整条链路。输入框初始值为“筑波大学”，临时修改为“筑波大学 手動確認”成功，随后恢复为“筑波大学”。

## 源码与运行链路

移植源为 `D:\workspace\droneci` 提交 `f1d2c5f`。核心构筑逻辑保存在 `D:\nginx\app\builder`。`standalone_packager.py`、`hv_vm_tools\config.py` 和 `hv_vm_tools\hyperv_host.py` 的哈希与移植源一致。

运行链路如下：

1. OneOps `App.tsx` 显示 `BuilderPage`。
2. iframe 请求 `/api/work-center/v1/builder/page`。
3. `gateway/server.mjs` 接收同源请求。
4. `builder-worker.mjs` 将 OneOps 路径映射为原构筑器路径。
5. 网关通过 JSON 行协议调用 `oneops_worker.py`。
6. worker 调用原 `host_standalone_console.py` Handler。
7. 构筑器通过 OneOps 同源代理访问远端构建终端。
8. 历史、日志和成果物下载继续由 OneOps 网关返回。

## 数据迁移

原历史目录和交付目录已移动到：

* `D:\nginx\app\builder-data\standalone-builds`
* `D:\nginx\app\builder-data\deliveries`

验证结果：

* 13 条任务元数据可按严格 UTF-8 解析
* 13 条任务状态均为 `success`
* 13 条任务均保留成果物清单
* 14 个正式交付目录可读取
* 原历史和交付目录已不存在

首次迁移在 Windows PowerShell 5.1 下遇到默认文本编码问题，13 个元数据 JSON 出现乱码。原配置历史、日志、成果物和数值字段仍完整。损坏副本保存在 `D:\nginx\backups\onebuild-metadata-encoding-20260724`。恢复脚本根据这些原始证据重建元数据，全部 13 条记录通过严格 UTF-8 和字段完整性验证。迁移脚本现使用带严格 UTF-8 的 `ReadAllText`，运维测试会检查这项约束。

## 生产验证

生产浏览器验证确认：

* OneOps 菜单内显示完整“製品構築”
* iframe 地址属于 `https://192.168.20.54`
* 构筑页面脚本地址为 `/api/work-center/v1/builder/app.js`
* 共通コンテキスト名称带入成功
* 机关名称允许手工编辑
* 构建终端显示“稼働中”
* 页面控制台错误 0，警告 0
* 截图保存在 `docs\evidence\oneops-product-builder-20260724.png`

监听验证只发现 `192.168.20.54:443` 和 `127.0.0.1:8092`。`8091` 与临时验证端口均无监听。OneOps 网关进程持有内部 Python worker 子进程。

## 验证边界

本次没有提交新的正式构筑任务。新任务会在远端执行实际构建并生成交付物，属于长时间外部状态变化。本次已验证页面初始化、同源 API、历史读取、终端资源读取、输入编辑、自动测试、生产构建和发布路径。
