# 試験結果

| 対象 | 結果 | 証拠 |
|---|---|---|
| AuthPage / Auth UI | 8 件成功 | Vitest |
| Gateway Auth | 31 件成功 | Node Test |
| Operations Scripts | 成功 | PowerShell Test |
| Portal TypeScript | 成功 | `tsc -b` |
| Gateway 全量試験 | 306 件成功 | 最新 `origin/master` 統合後の Node Test |
| Worker 全量試験 | 14 件成功 | 正式 Python Runtime を絶対 Path で使用 |
| Portal 全量試験 | 256 件成功 | 最新 `origin/master` 統合後の Vitest |
| Portal Production Build | 成功 | Vite Build、`index-C05tyVld.css`、`index-DrO7Gw0m.js` |
| 差分整合性 | 成功 | `git diff --check`、換行警告のみ |

Runtime、Browser、Console 及び Screenshot は配信段階で記録する。

隔離 Worktree から Root の `pnpm test` を実行した際、Gateway 306 件成功後に相対 Path `..\runtime\python\python.exe` が存在せず終了した。正式 Runtime `D:\nginx\runtime\python\python.exe` を指定して Worker 14 件を再実行し、全件成功した。
