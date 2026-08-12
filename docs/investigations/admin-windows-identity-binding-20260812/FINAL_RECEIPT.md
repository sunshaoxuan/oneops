# 最終受入記録

## 受入一覧

| 受入項目 | 成果物 | 検証証拠 | 判定 |
|---|---|---|---|
| 管理者がローカルユーザーへ Windows Identity をバインドできる | API、Repository、Portal | Gateway 全量及び Portal 対象試験 | 合格 |
| 同じ Windows Subject を複数ユーザーへ割り当てない | DB 一意制約、競合応答 | Repository、Controller 試験 | 合格 |
| Windows Identity だけを解除できる | DELETE API、Portal | Repository、Controller、Portal 試験 | 合格 |
| 権限、CSRF、監査を適用する | Auth Controller | Controller 試験 | 合格 |
| 正式画面で操作可能である | HTTPS Browser | SSO 待機画面、Console 0 件、Screenshot | 未合格 |
| 実行時へ配信する | 配信成果物 | Health `UP 0.18.20`、未認証 API `401` | 一部合格 |

## 現在の完了判定

ソース実装と本タスク対象試験は合格した。Commit `af82be5c5f83f1d7874ee2d3edacca1e6eeefbb4` は `origin/master` へ Push 済みである。HTTPS Health は `UP 0.18.20`、未認証 Binding API は `401 AUTHENTICATION_REQUIRED` を返した。Browser は Windows SSO 確認待機から進まず、管理者ユーザー画面へ到達できなかった。Console Error と Warning は 0 件で、待機状態 Screenshot を保存した。Portal 全量試験と TypeScript Build は、同じ `origin/master` に含まれる AIアシスタント並行変更の Source、Test 及び型契約不一致により不合格である。管理者画面、実 DB Index、実 Binding、Audit、正式配信の最終受入は未完了とする。
