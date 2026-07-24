# 命令记录

所有命令于 `D:\nginx` 或 `D:\nginx\app` 执行。

## 来源审计

1. 枚举 EnvPortal 数据文件及 SHA256。
2. 使用 PowerShell `Import-Csv` 读取表头和记录数量。
3. 仅输出非秘密字段与凭据字段是否存在的布尔值。
4. 查询 OneOps 组织机构 Code、物理 ID 和现有环境数量。

## 预演

```powershell
D:\nginx\runtime\node\node.exe --env-file=.env.local scripts/import-envportal.mjs --source-root D:\workspace\envPortal --dry-run --report D:\nginx\app\.test-work\envportal-import-20260724\dry-run.json
```

## 备份

使用 PostgreSQL 容器内 `pg_dump --format=custom` 生成备份，再复制到：

`D:\nginx\backup\oneops-before-envportal-import-20260724-1801.dump`

## 正式导入

```powershell
D:\nginx\runtime\node\node.exe --env-file=.env.local scripts/import-envportal.mjs --source-root D:\workspace\envPortal --apply --report D:\nginx\docs\evidence\envportal-import-summary-20260724.json
```

同一命令再次执行，用于验证重复批次识别。

## 验证

1. 查询批次、暂存行和正式环境数量。
2. 扫描暂存 JSON 是否出现凭据字段名。
3. 执行 `pnpm check`。
4. 访问 `https://192.168.20.54/`。
5. 选择筑波大学并打开环境信息。
6. 检查 UHR 卡片、范围、用途、状态、URL、最后确认日和迁移备注。
7. 检查浏览器控制台错误与警告。
