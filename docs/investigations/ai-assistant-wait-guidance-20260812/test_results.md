# Test 結果

| 対象 | 結果 |
| --- | --- |
| Focus | 3 Files、36 Tests 合格 |
| Gateway | 302 合格 |
| Worker | 14 合格 |
| Portal | 43 Files、253 Tests 合格 |
| TypeScript | `tsc --noEmit` 合格 |
| Production Build | 3853 Modules、成功 |
| Backend | 41 Tests、33 合格、8 Environment Skip、失敗 0 |
| nginx | Configuration Test 成功 |

正式 Browser は HTTPS 画面を表示したが、`Windows にログイン中のアカウントを確認しています。` から遷移せず、認証後の AI アシスタントへ到達できなかった。認証待機画面の Console Error と Warning は 0 件だった。再送信 Button、実 Task、認証後 Console 及び対象 Screenshot は `evidence_missing` とする。
