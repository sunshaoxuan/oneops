# 証跡索引

| 主張 | 証跡 | 信頼度 | 制約 |
| --- | --- | --- | --- |
| 旧実装は画面を React 状態だけで管理していた | 修正前 `App.tsx` の `useState<NavigationKey>("workbench")` とメニュー処理 | 高 | Git 差分と調査コマンドで確認 |
| URL と画面を相互変換する | `app/apps/portal-shell/src/portal-navigation.ts` | 高 | 定義済み Portal 画面が対象 |
| 戻る操作と進む操作を処理する | `App.tsx` の `popstate` リスナー | 高 | 同一タブの OneOps 履歴が対象 |
| 第 2 階層機能も復元する | `portal-navigation.test.ts` と `layout.test.ts` | 高 | 編集モーダルなど一時 UI は対象外 |
| 直接 URL の再読み込みを配信できる | `conf/nginx.conf` の `try_files $uri $uri/ /index.html` | 高 | OneOps HTTPS 配信設定が対象 |
| 実画面で再読み込みと履歴移動が成功する | `test_results.md` と画面証跡 | 高 | ログイン済み Chrome で確認 |

## 画面証跡

`docs/evidence/portal-navigation-history-20260728.png`

画面証跡はシステム管理の見出し領域だけを使用し、ユーザー情報、設定値、監査明細、顧客情報を含めていない。
