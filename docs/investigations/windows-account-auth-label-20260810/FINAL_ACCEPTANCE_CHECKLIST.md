# 最終受入一覧

## 基準

当初目的は、一般利用者が技術略語の知識を必要とせず、Windows にログイン中のアカウントを使用する認証だと理解できるログイン画面へ変更することである。

| 項目 | 成果物 | 検証証拠 | 状態 |
| --- | --- | --- | --- |
| 見出しから単独の `SSO` を除去する | `AuthPage.tsx` | Source 回帰試験 | 合格 |
| 日本語の認証方式を明確にする | 「Windows アカウント認証」 | Browser Screenshot | 合格 |
| 日本語の操作対象を明確にする | 「Windows にログイン中のアカウントで認証」 | Browser Screenshot | 合格 |
| 自動認証の待機状態を明確にする | 日本語待機文言 | Source 回帰試験 | 合格 |
| 三言語の意味を統一する | 日本語、中国語、英語 Copy | Source 回帰試験 | 合格 |
| 認証処理契約を維持する | Config、Route、処理識別子 | Gateway 218 Test | 合格 |
| 関連要件を更新する | 認証要件文書、CHANGELOG | Project Language 試験 | 合格 |
| 全体品質を維持する | 全単体試験、Build、運用 Script | `test_results.md` | 合格 |
| 利用中断を伴わず正式配信する | Rolling 配信 | `delivery_succeeded`、HTTPS 100 Request 全件 200 | 合格 |
| 公開画面と Console を確認する | 実 Browser | Screenshot、Console 0 件 | 合格 |
| Version 管理と正式 Git を完了する | 0.16.2、origin/master、Tag | Git 検証 | 提出前 |

Git 提出を除く全項目が合格した。Git Commit、Push、Tag 及び Remote 一致確認後に最終状態を確定する。
