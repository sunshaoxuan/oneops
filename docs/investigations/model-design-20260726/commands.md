# 命令记录

1. `node --test gateway/model-settings.test.mjs gateway/credential-crypto.test.mjs gateway/auth.test.mjs`
2. `pnpm --filter @one-ops/portal-shell test`
3. `pnpm --filter @one-ops/portal-shell build`
4. `pnpm test`
5. `pnpm build`
6. `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/publish-portal.ps1 -Reason model-design-20260726`
7. `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/publish-portal.ps1 -Reason model-design-full-width-20260726`
8. `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/publish-portal.ps1 -Reason model-design-actions-alignment-20260726`
9. `docker exec onehr-operations-postgres ... psql ...`，只查询迁移、权限和配置记录数。
10. 浏览器加载生产构建产物，验证菜单、全宽表单、按钮顺序与右对齐、虚构连接结果、控制台和截图。
