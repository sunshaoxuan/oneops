# 最終受入記録

## 受入一覧

| 受入項目 | 成果物 | 検証証拠 | 判定 |
|---|---|---|---|
| 管理者がローカルユーザーへ Windows Identity をバインドできる | API、Repository、Portal | Gateway 全量及び Portal 対象試験 | 合格 |
| 同じ Windows Subject を複数ユーザーへ割り当てない | DB 一意制約、競合応答 | Repository、Controller 試験 | 合格 |
| Windows Identity だけを解除できる | DELETE API、Portal | Repository、Controller、Portal 試験 | 合格 |
| 権限、CSRF、監査を適用する | Auth Controller | Controller 試験 | 合格 |
| 正式画面で操作可能である | HTTPS Browser | Browser、Console、Screenshot | 未実施 |
| 実行時へ配信する | 配信成果物 | Health、API、配信ログ | 未実施 |

## 現在の完了判定

ソース実装と本タスク対象試験は合格した。Portal 全量試験と TypeScript Build は、同じ `origin/master` に含まれる AIアシスタント並行変更の Source、Test 及び型契約不一致により不合格である。正式画面、Console、Screenshot、配信及び実 DB の最終受入は未完了とする。
