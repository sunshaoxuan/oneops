# 試験結果

更新日: 2026-08-06

| 試験 | 結果 |
| --- | --- |
| Runtime SelfTest | ローカルログイン、SSO 接続先無効化、秘密維持を確認 |
| 運用 Script | 9 Script、全契約成功 |
| Gateway | 192 件成功 |
| Builder Python | 14 件成功 |
| Portal | 18 File、153 件成功 |
| Portal Production Build | 成功、Asset `index-CMX-VTby.js` |
| Spring Backend | 33 件成功、Skip 7 件 |
| 正式 Auth Config | SSO Enabled false、AutoLogin false、URL 空 |
| 正式 Runtime | LOCAL、AutomaticSso false、HTTPS true |
| Browser | ユーザー名、パスワード画面へ直接到達 |
| Browser Console | Error 0、Warning 0 |
| 認証後 Browser | 顧客情報と Learning Gap を確認 |

並行開発中の個人タスク変更を一時隔離した状態で全量試験を実行した。隔離対象は本タスクの Commit に含めない。
