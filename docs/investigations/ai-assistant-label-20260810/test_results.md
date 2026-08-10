# 試験結果

更新日: 2026-08-10

## 関連試験

| 対象 | 結果 |
|---|---|
| Gateway Migration と個人タスク | 19 件合格 |
| Portal 名称、AI 会話、権限、個人タスク | 9 File、64 件合格 |
| Spring Boot | 40 件中 32 件合格、Database 条件の 8 件 Skip、失敗 0 |

## 全量試験と Build

`D:\nginx\runtime\node\pnpm.cmd check` を実行し、次を確認した。

1. Gateway 247 件合格。
2. Python Worker 14 件合格。
3. Portal 30 File、196 件合格。
4. TypeScript Compile と Vite 本番 Build に成功。

Vite は既存の 1,100 kB を超える Chunk について警告した。Build は成功しており、本変更による Error はない。

## 運用 Script

`scripts/test-operations-scripts.ps1` を実行し、9 Script の解析、Atomic Publish、固定 Port Restart Barrier、Gateway Rolling Switch、Frontend Gateway 維持、Runtime Recovery、Composite Readiness、Runtime Supervisor 及び Installer を含む全検査が合格した。

## 公開と Browser

公開、Health、Readiness、Browser、Console、Screenshot は Commit と Push 後に記録する。
