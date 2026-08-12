# 試験結果

| 対象 | 結果 | 証拠 |
|---|---|---|
| Auth、Controller、Repository | 35 件成功 | Node 対象試験 |
| Profile UI | 6 件成功 | Vitest 対象試験 |
| Portal TypeScript | 成功 | `tsc -b` |
| Gateway 全量 | 302 件成功 | Node 全量試験 |
| Portal 全量 | 247 件成功 | Vitest 全量試験 |
| Portal Production Build | 成功 | Vite Production Build |
| Diff Check | 成功 | `git diff --check` |

Migration 048 と Gateway は継続配信成功を確認した。Health は `UP 0.18.20`、未認証 Password API は `401 AUTHENTICATION_REQUIRED`。Browser は Windows SSO 確認待機、Console Error と Warning は 0 件。Profile UI の正式 Screenshot は未取得とする。
