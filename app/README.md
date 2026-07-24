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

环境台账第一阶段已经启用。页面按当前组织机构物理 ID 加载环境组、环境、产品与版本关系，支持维护、筛选、复制、排序、归档和恢复。VPN、服务器端点、资料证据和 AI 解析入口保留到安全基础完成后的阶段。

产品与版数是系统共通基础档案，在“管理”中与组织区分同级。档案内部采用产品主档、版数子档、功能模块孙档的三级结构。组织环境引用产品版数物理 ID，并登记该版数下实际采购的功能模块。

用户注册、登录、会话、Windows SSO 自动建档和标准 RBAC 已接入工作中心网关。首次注册用户完成系统管理员引导，后续用户由系统管理员审核并分配系统范围或组织机构范围角色。Windows SSO 复用 EnvPortal 在 OHR0067 上的域认证结果，OneOps 独立维护用户、外部身份、会话和角色。域 UPN 使用 `tokyo.scientia.co.jp`，企业邮箱使用 `onehr.jp`。旧版 8998 缺少 UPN 或邮箱时，OneOps 通过允许的 Windows 域、UPN 后缀映射和显式账号链接恢复正确身份。用户管理和个人资料只读显示完整域账号及域 UPN，域名和域用户名继续保存在底层身份档案中。

用户角色分配的范围下拉框默认选择“全体”，该选项表示角色权限适用于全部组织机构。需要限制到单一组织机构时再选择具体组织。

本机验证命令：

```powershell
$env:PATH="D:\nginx\runtime\node;$env:PATH"
pnpm check
```

生产构建位于 `D:\nginx\app\apps\portal-shell\dist`，本机 HTTPS 发布目录为 `D:\nginx\html`。
