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

## Production 再受入

| 対象 | 結果 | 証拠 |
|---|---|---|
| Shared Source 焼戻し防止 | 成功 | Shared `AuthPage.tsx`、Test、CSS、Operations Test を現行契約へ同期 |
| Shared Focused Test | 8 件成功 | Vitest |
| Shared Production Build | 成功 | `index-BGZ1HwoB.js`、後続配信 `index-w5LcsfGH.js` |
| Formal nginx Config | 成功 | `nginx -t`、Silent Location 0 件 |
| Formal Delivery | 成功 | `delivery_succeeded reason=sso-direct-navigation-repair-95ee160`、後続 CD も成功 |
| Runtime | 成功 | HTTPS 200、Health UP、Version 0.18.20、SSO URL `http://OHR0067:8998/oneops_sso.jsp` |
| Production Asset | 成功 | `/sso/windows/silent` なし、Auto Attempt Marker あり |
| Browser DOM | 成功 | LOCAL Login と手動 Windows SSO Button を確認 |
| Browser Console | 成功 | Warning 0、Error 0 |
| Browser Screenshot | 成功 | 1024 x 768 Login Page |
| 実 Domain SSO 完了 | `evidence_missing` | Domain Credential を持つ Browser が未接続、Callback 0 件 |

最初の隔離 Build 配信後、Shared Source を使う後続自動配信が旧 Silent Asset を再公開したため、不合格として Shared Source へ修復を同期した。Focused Test、Build、Delivery、Production Asset、Health、Browser、Console 及び Screenshot の全受入を先頭から再実行した。
