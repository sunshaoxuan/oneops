# OneOps 本机持续交付

更新日: 2026-07-30

## 目标

OneOps 源码变更后自动执行测试、生产构建和本机发布。发布过程先复制带内容哈希的静态资源，最后切换 `index.html`，保证页面不会引用尚未就绪的资源。

## 交付门禁

每次交付依次执行以下检查。

1. 后端单元测试。
2. 前端单元测试。
3. TypeScript 编译和 Vite 生产构建。
4. Nginx 配置检查。
5. 网关健康检查。网关、构筑器、数据库或运行配置变化时执行网关重启。
6. HTTPS 首页检查。

任一检查失败时保留当前已发布版本，并把原因写入 `D:\nginx\app\logs\continuous-delivery.log`。

## 实时触发

计划任务 `OneOps Continuous Delivery` 在系统启动时运行文件监视器。源码、配置、数据库迁移、脚本或需求文档变化后等待 300 毫秒合并连续写入事件，然后立即启动完整交付。

`node_modules`、生产构建目录、日志、测试工作区、`.codex-work` 隔离工作树和 `.env.local` 不触发交付，避免构建产物形成循环或由非正式工作树覆盖正式 Web Root。

仅修改 `apps\portal-shell`、`packages\api-client` 或 `docs` 时，发布静态资源并验证既有网关健康状态，不重启固定端口 `127.0.0.1:8092`。涉及网关、构筑器、数据库、脚本或其他运行文件时，等待网关停止且端口释放状态稳定 5 秒后再启动。

需要主动触发一次完整交付时，可以更新时间戳文件
`D:\nginx\app\.continuous-delivery.trigger`。它只负责触发，不参与应用构建。

OneOps 自动 SSO 复用 EnvPortal 的持续发布链路和 OHR0067 上既有的 8998 域认证代理。EnvPortal 中转端点发布后，`configure-envportal-sso.ps1` 启用 OneOps 自动登录并重启网关。

## 常時稼働との連携

継続的デリバリーは変更のテスト、ビルド、公開を担当します。Windows タスク `OneOps Runtime Supervisor` は公開後の長期稼働を担当し、Docker Desktop、PostgreSQL、Gateway、自動 SSO、Nginx HTTPS を 30 秒間隔で確認します。

ランタイムスクリプトを変更した公開では Gateway を再起動します。公開処理と常駐監視は共通のグローバル Mutex `Global\OneOpsContinuousDelivery` を使用します。公開中は常駐監視が復旧処理を見送り、常駐監視中に開始した公開は最大 5 分間待機します。常時稼働の詳細は `D:\nginx\docs\RUNTIME_AVAILABILITY.md` を参照してください。

## 安全边界

计划任务使用 `SYSTEM` 运行。安装时将 `D:\nginx\app` 写权限限制为 `SYSTEM` 和本机管理员，普通用户保留只读权限，防止通过修改构建脚本取得高权限执行。

## 手工发布

需要立即执行同一交付链路时运行：

```powershell
D:\nginx\app\scripts\publish-portal.ps1
```

## 回滚

停止实时交付：

```powershell
Unregister-ScheduledTask -TaskName "OneOps Continuous Delivery" -Confirm:$false
```

恢复 `D:\nginx\app` 的父目录权限继承：

```powershell
icacls.exe D:\nginx\app /inheritance:e
```
