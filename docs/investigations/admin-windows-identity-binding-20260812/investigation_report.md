# 管理者 Windows SSO バインド調査

## 調査対象

管理者が追加したローカルユーザーへ Windows 認証ユーザーを紐付け、同じ OneOps ユーザーとして Windows SSO を利用できる管理経路を調査した。

## 変更前の経路

Windows SSO 成功時の `provisionWindows` は、既存 Windows Subject、企業メール一致及び明示 Account Link からユーザーを解決し、Windows 外部アイデンティティを自動作成できた。ユーザー管理画面は Subject と UPN を表示したが、管理者が手動でバインド又は解除する API と操作を持たなかった。

## 変更後の契約

1. `PUT /api/work-center/v1/auth/users/{userId}/windows-identity` は管理者が Windows Subject と UPN をバインド又は更新する。
2. `DELETE /api/work-center/v1/auth/users/{userId}/windows-identity` は対象ユーザーの Windows 外部アイデンティティだけを解除する。
3. 両 API は `identity.users.write`、CSRF、ユーザー物理 ID 及び監査を必須とする。
4. Subject は許可済み Windows ドメインに限定し、UPN は許可済みサフィックスに限定する。Subject と UPN のユーザー名は一致させ、機械アカウントを拒否する。
5. `(provider, subject_normalized)` と Windows Provider に限定した `user_id` の二つの一意制約により、同じ Windows Subject の重複及び一人のユーザーへの複数 Windows Identity を防止する。
6. ユーザー編集画面は既存バインドを初期表示し、バインド保存と確認付き解除をユーザー権限保存から独立して実行する。

## データ境界

OneOps ユーザー物理 ID が主となり、Windows Subject と UPN は外部アイデンティティ属性である。バインド及び解除はユーザー、ロール、所属、ローカルパスワード及び業務データを変更しない。
