# 自動検証結果

| 区分 | 実行結果 |
| --- | --- |
| Gateway の対象 Test | 38 件成功 |
| Portal の対象 Test | 11 件成功 |
| `pnpm --dir app check` Gateway | 332 件成功 |
| `pnpm --dir app check` Worker | 32 件成功 |
| `pnpm --dir app check` Portal | 282 件成功 |
| TypeScript と Vite Production Build | 成功 |
| Nginx Configuration Test | 成功 |

Vite は既存の Chunk Size Warning を出力した。Build は成功しており、本変更による Error ではない。
