# OneOps

OneOps 是面向 OneHR 保守运维工作的统一门户，集中管理组织机构、产品与版本、客户环境、权限、问合支援和产品构筑等业务信息。

当前版本：`0.2.0`

## 主要功能

- 组织机构与组织区分档案
- 产品、版本和功能模块档案
- 客户环境、服务器连接端点与凭据维护
- 用户、角色、权限与认证审计
- 问合支援与 AI 设置
- OneOps 内置产品构筑

## 工程结构

- `app/`：Portal、网关、数据库迁移、脚本和测试
- `docs/`：需求、技术说明、调查记录和验证证据
- `html/`：本机发布目录，属于运行时产物，不纳入 Git
- `runtime/`：本机运行时依赖，不纳入 Git

## 本机命令

```powershell
D:\nginx\start.ps1
D:\nginx\runtime\node\pnpm.cmd --dir D:\nginx\app check
```

## 文档

- [项目规则](docs/PROJECT_RULES.md)
- [文档索引](docs/README.md)
- [版本管理](docs/VERSIONING.md)
- [变更记录](CHANGELOG.md)

## 版本管理规则

正式远端为 `https://github.com/sunshaoxuan/oneops.git`，正式分支为 `master`。通过测试的修改直接提交到 `origin/master`。只有用户明确提出时才创建其他分支或 Pull Request。

密码、令牌、私钥、运行时环境变量、日志和备份不得进入仓库。
