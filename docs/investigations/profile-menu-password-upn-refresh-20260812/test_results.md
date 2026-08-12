# 試験結果

| 対象 | 結果 | 証拠 |
|---|---|---|
| Profile / Dropdown UI | 6 件成功 | Vitest 対象試験 |
| Portal TypeScript | 成功 | `tsc -b` |
| Auth / Password / Identity | 35 件成功 | Node 対象試験 |
| Gateway 全量 | 302 件成功 | `node --test gateway/*.test.mjs` |
| Portal 全量 | 249 件成功 | `vitest run` |
| Production Build | 成功 | `vite build` |
| Production UPN | `x02851@tokyo.scientia.co.jp` を確認 | Password Hash を取得しない Read-only SQL |

Remote Master 統合後の Clean Worktree で再実行し、Gateway 302 件及び Portal 249 件が成功した。Build では既存の Chunk Size Warning だけが出力され、Error はなかった。Runtime、Browser、Console 及び Screenshot は配信後に記録する。

正式配信は成功し、nginx 設定試験、HTTPS Health `UP`、Version `0.18.20` を確認した。In-app Browser は Windows SSO 確認画面に留まり、Console Error 及び Warning は 0 件だった。認証済み画面の Screenshot は `evidence_missing` である。
