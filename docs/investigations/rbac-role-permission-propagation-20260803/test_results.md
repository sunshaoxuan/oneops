# テスト結果

更新日: 2026-08-03

| 検証 | 結果 |
| --- | --- |
| Gateway 全体テスト | 成功、147 tests |
| Python テスト | 成功、7 tests |
| Portal Shell テスト | 成功、120 tests |
| TypeScript と production build | 成功 |
| Nginx 構成検査 | 成功 |
| Gateway health | 成功、status UP |
| 公開後 HTTPS | 成功、HTTP 200 |
| `catalog.read` なしの第1階層入口 | 非表示を確認 |
| `catalog.read` なしの `/master-data` 直接指定 | `/` への補正を確認 |
| `catalog.read` 追加後のログイン中画面 | 10 秒以内に基本台帳入口の表示を確認 |
| `catalog.read` と `catalog.write` なし | 3 台帳を参照でき、追加・編集操作 0 件を確認 |
| `catalog.read` 撤回後の表示中画面 | 10 秒以内に `/` へ遷移し、入口と見出しの消去を確認 |
| ブラウザーコンソール | error 0 件、warning 0 件 |
| 正式 `VIEWER` ロール | `catalog.read` なし、割当利用者 8 件、他の 6 権限を維持 |
| ロール変更監査 | `ROLE_UPDATED`、`SUCCESS`、削除権限 `catalog.read` を確認 |

ブラウザー検証には一時利用者と一時ロールを使用し、既存利用者と既存ロールは変更していません。検証後に一時利用者、一時ロール、一時セッションを削除しました。
