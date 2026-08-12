# 試験結果

| 対象 | 結果 | 証拠 |
|---|---|---|
| Profile / Dropdown UI | 6 件成功 | Vitest 対象試験 |
| Portal TypeScript | 成功 | `tsc -b` |
| Auth / Password / Identity | 35 件成功 | Node 対象試験 |
| Gateway 全量 | 302 件成功 | `node --test gateway/*.test.mjs` |
| Portal 全量 | 250 件成功 | `vitest run` |
| Production Build | 成功 | `vite build` |
| Production UPN | `x02851@tokyo.scientia.co.jp` を確認 | Password Hash を取得しない Read-only SQL |

Build では既存の Chunk Size Warning だけが出力され、Error はなかった。Runtime、Browser、Console 及び Screenshot は配信後に記録する。
