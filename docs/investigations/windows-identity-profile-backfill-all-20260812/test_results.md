# 試験結果

| 対象 | 結果 | 証拠 |
|---|---|---|
| Identity、EnvPortal、Auth 対象試験 | 45 件成功 | Node Test |
| User Management UI | 6 件成功 | Vitest |
| Portal TypeScript | 成功 | `tsc -b` |
| Migration Transaction | 14 件対象、補完後欠損 0 | Rollback 検証 |
| Gateway 全量 | 304 件成功 | Node Test |
| Portal 全量 | 252 件成功 | Vitest |
| Production Build | 成功 | Vite Build |

Build では既存の Chunk Size Warning だけが出力され、Error はなかった。Production Apply、Runtime 及び Browser は次段階で記録する。
