# 证据索引

| 结论 | 证据 | 可信度 | 限制 |
|---|---|---:|---|
| GitHub 远端存在且签入前为空 | `gh repo view`、`git ls-remote` | 高 | 检查时间为 2026-07-27 |
| 本地历史未发现常见密钥特征 | 40 个提交的内容扫描 | 高 | 基于已定义的常见密钥模式 |
| 正式交付只使用 master | `AGENTS.md`、`docs/PROJECT_RULES.md` | 高 | 用户明确要求时可以调整 |
| 项目版本统一为 0.2.0 | `VERSION`、两个 `package.json`、Portal 画面 | 高 | 无 |
| 完整自动化与生产构建通过 | `test_results.md` | 高 | 保留既有构建体积提醒 |
| 生产页面版本显示正确 | `docs/evidence/github-master-version-20260727.png` | 高 | 局部截图 |
| 问合等级徽标真实发布生效 | `docs/evidence/inquiry-level-badge-20260727.png` | 高 | 验证样本源值为空 |
