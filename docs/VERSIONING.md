# 版本管理

更新时间：2026-07-27

## 版本号

OneOps 使用 Semantic Versioning，格式为 `主版本.次版本.修订版本`。

- 主版本：存在不兼容的数据、接口或运维方式变化
- 次版本：增加向后兼容的功能
- 修订版本：修复向后兼容的问题

根目录 `VERSION` 保存当前项目版本。发布时必须同步更新：

- `VERSION`
- `CHANGELOG.md`
- `app/package.json`
- `app/apps/portal-shell/package.json`
- Portal 画面版本号

## 发布流程

1. 获取并核对 `origin/master`。
2. 更新代码、相关文档和版本记录。
3. 执行完整测试、生产构建和必要的发布验证。
4. 提交并直接推送到 `origin/master`。
5. 为正式版本创建 `v<version>` 标签并推送。
6. 核对本地 `HEAD`、`origin/master` 和标签目标一致。

只有用户明确提出时才创建其他分支或 Pull Request。
