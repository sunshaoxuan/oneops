# EnvPortal 用户迁移调查报告

## 目标

把 EnvPortal 生产用户转换为 OneOps 自有用户、Windows 身份和标准 RBAC 分配。迁移后由 OneOps 独立管理用户与授权。

## 来源确认

生产来源为 `\\192.168.20.38\C$\workspace\envPortal`。迁移只读取其中的 `users.json` 和 `roles.json`。开发目录中的同名文件不作为生产数据来源。

源数据包含 12 名真人账号和 6 个旧角色。生产文件在执行前复制到批次备份目录，并记录 SHA256。

## 映射规则

1. Windows 完整域账号相同时合并现有 OneOps 用户。
2. 可靠的 `onehr.jp` 邮箱可作为第二合并条件。
3. 新用户的 EnvPortal `admin` 转换为 OneOps `OPERATOR`，范围为全体组织机构。
4. 新用户的其他旧角色转换为 OneOps `VIEWER`，范围为全体组织机构。
5. 既有 OneOps 用户保留账号状态、显示名覆盖和全部角色。
6. 缺少可靠企业邮箱时保持邮箱为空。
7. 保存 `TOKYO\账号`、域 UPN、来源角色和来源时间。IP 地址不进入 OneOps。
8. EnvPortal 旧管理员不会自动获得 `SYSTEM_ADMIN`。

## 执行结果

预演结果为新建 11 人、合并 1 人、冲突 0 人、忽略 0 人。生产执行在单一数据库事务中完成。

迁移后 OneOps 共有 12 名 Windows 域用户。其中 2 名新用户为 `OPERATOR`，9 名新用户为 `VIEWER`，既有 `sun.shaoxuan@onehr.jp` 继续保留 `SYSTEM_ADMIN`。

每名用户都有全域账号 `TOKYO\账号` 和域 UPN `账号@tokyo.scientia.co.jp`。12 条 `ENVPORTAL_USER_MIGRATED` 审计事件已写入。

## 数据修正

复核发现 EnvPortal 空邮箱可覆盖既有身份元数据邮箱。合并函数已改为跳过空的可选字段，并增加回归测试。超级管理员 Windows 身份元数据邮箱已恢复为 `sun.shaoxuan@onehr.jp`。
