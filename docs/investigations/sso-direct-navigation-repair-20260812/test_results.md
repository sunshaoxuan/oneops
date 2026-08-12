# 試験結果

| 対象 | 結果 | 証拠 |
|---|---|---|
| AuthPage / Auth UI | 8 件成功 | Vitest |
| Gateway Auth | 31 件成功 | Node Test |
| Operations Scripts | 成功 | PowerShell Test |
| Portal TypeScript | 成功 | `tsc -b` |
| Gateway 全量試験 | 304 件成功 | Node Test |
| Portal 全量試験 | 255 件成功 | Vitest |
| Portal Production Build | 成功 | Vite Build、`index-C05tyVld.css`、`index-D1b22lN3.js` |
| 差分整合性 | 成功 | `git diff --check`、換行警告のみ |

Runtime、Browser、Console 及び Screenshot は配信段階で記録する。
