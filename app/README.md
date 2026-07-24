# OneOps Portal

OneHR 保守运维工作中心的 Portal Shell、实时兼容网关和 PostgreSQL 组织机构档案。

工程根目录为 `D:\nginx`。详细规则和组织机构需求见：

* `D:\nginx\docs\PROJECT_RULES.md`
* `D:\nginx\docs\ORGANIZATION_DIRECTORY_REQUIREMENTS.md`
* `D:\nginx\docs\ENVIRONMENT_MANAGEMENT_REQUIREMENTS.md`
* `D:\nginx\docs\AUTHENTICATION_AND_RBAC_REQUIREMENTS.md`

## Commands

```powershell
D:\nginx\start.ps1
```

组织机构档案使用物理 ID 作为主键，业务代码保持唯一。普通画面不显示物理 ID。数据源清单位于 `config/system.config.json`，Excel 数据源按区分、机关 Code、机关名、略称和保守有无执行增量导入。

环境台账已经启用。页面按当前组织机构物理 ID 加载环境组、环境、产品与版本关系，支持维护、筛选、复制、排序、归档和恢复。服务器连接端点支持新增和编辑，端点账号密码支持加密保存、显式查看、复制和维护。VPN、资料证据和 AI 解析入口继续按后续阶段实施。

产品与版数是系统共通基础档案，在“管理”中与组织区分同级。档案内部采用产品主档、版数子档、功能模块孙档的三级结构。组织环境引用产品版数物理 ID，并登记该版数下实际采购的功能模块。

EnvPortal 数据使用一次性导入命令迁移。命令默认执行预演，只有传入 `--apply` 才写入数据库。导入器按文件哈希和脱敏行指纹去重，现有同名环境进入冲突报告。登录 ID、密码和数据库用户字段进入加密凭据表，暂存行、报告和日志只记录字段数量。迁移同时读取 OneOps 已登记的机构别制品资料，将环境放入范围对应的分组，把 URL、DB 和 RDP 拆分为连接端点，并把有依据的产品登记为确认待候选。UHR 识别为独立产品 U-PDS給与明細，实际版数按功能模块确认。机构级制品列只保留为模块候选，只有与正式功能模块档案精确匹配后才建立模块关系。

```powershell
D:\nginx\runtime\node\node.exe --env-file=.env.local scripts/import-envportal.mjs --source-root D:\workspace\envPortal --dry-run
```

用户注册、登录、会话、Windows SSO 自动建档和标准 RBAC 已接入工作中心网关。首次注册用户完成系统管理员引导，后续用户由系统管理员审核并分配系统范围或组织机构范围角色。Windows SSO 复用 EnvPortal 在 OHR0067 上的域认证结果，OneOps 独立维护用户、外部身份、会话和角色。域 UPN 使用 `tokyo.scientia.co.jp`，企业邮箱使用 `onehr.jp`。旧版 8998 缺少 UPN 或邮箱时，OneOps 通过允许的 Windows 域、UPN 后缀映射和显式账号链接恢复正确身份。用户管理和个人资料只读显示完整域账号及域 UPN，域名和域用户名继续保存在底层身份档案中。

用户角色分配的范围下拉框默认选择“全体”，该选项表示角色权限适用于全部组织机构。需要限制到单一组织机构时再选择具体组织。

EnvPortal 生产用户使用独立的一次性导入命令迁移。导入器默认预演，按 Windows 完整域账号和可靠企业邮箱合并现有用户，保留既有 OneOps 角色；新用户中的旧 `admin` 映射为全体范围 `OPERATOR`，其他旧角色映射为全体范围 `VIEWER`。迁移过程不猜测企业邮箱，并保存源快照、目标快照、哈希、迁移报告和审计事件。

本机验证命令：

```powershell
$env:PATH="D:\nginx\runtime\node;$env:PATH"
pnpm check
pnpm import:envportal-users -- --source-root "\\192.168.20.38\C$\workspace\envPortal" --output-dir "D:\nginx\backups\identity-migrations\<batch>"
```

生产构建位于 `D:\nginx\app\apps\portal-shell\dist`，本机 HTTPS 发布目录为 `D:\nginx\html`。
