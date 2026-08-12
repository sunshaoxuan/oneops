# 管理者によるユーザー追加の復元

## 調査結果

ユーザー管理画面には編集、状態変更、ロール割当、代理ログインだけが存在し、管理者向け `POST /auth/users` と追加フォームは欠落していた。公開 `POST /auth/register` は未認証の自己登録経路であり、管理者追加の代替にはならない。

## 修正契約

`identity.users.write` を持つ管理者だけが、ユーザー名、表示名、任意メール、パスワードを入力してローカルユーザーを追加できる。Gateway は既存 `validateRegistration` と `hashPassword` を使用し、新規ユーザーを `ACTIVE`、`VIEWER` ロール、LOCAL 認証として保存する。重複は 409、输入不正は 400、CSRF 失敗は既存境界で拒否する。成功は `USER_CREATED` 監査を記録する。

## 検証

- Gateway Auth Controller 13 項目合格
- Portal Auth UI、UserStatusSelect 6 項目合格
- TypeScript Build 合格
- 全量 Check は Gateway 285 項目、Portal 221 項目、Builder 14 項目、Vite 3850 Modules で合格した。
- SYSTEM Continuous Delivery は 2026-08-12 10:51:20 JST に成功した。
- 正式 HTTPS Health は `UP`、Version `0.18.20`、Upstream Online、Nginx Upstream `127.0.0.1:8092` である。
- 正式 Browser のユーザー管理見出し右側に「ユーザーを追加」Button を確認した。Console Error と Warning は 0 件である。
- Button 表示の Screenshot は `docs/evidence/admin-user-create-button-20260812.png` とする。
- 実ユーザー作成は本番データを増加させるため実行していない。Form と API の保存契約は自動試験で確認した。

## 保存時の入力検証修正

利用者の試行で、パスワードがサーバーの複雑性要件を満たさない場合に英語の総称エラーだけが表示される問題を確認した。ユーザー名、表示名及びメールは提示された入力例で現行規則を満たしており、画面に未表示だったパスワード要件が失敗項目である。

追加フォームへユーザー名、メール及びパスワードの送信前検証を追加した。パスワードは12文字以上、大文字、小文字、数字及び記号を各1文字以上含むことを画面に常時表示する。API の項目別エラーは対応する入力欄へ現在言語で表示し、総称の英語メッセージは利用者へ表示しない。

聚焦試験 `vitest run src/auth-ui.test.ts` は6件合格した。全量 `pnpm check` は Gateway 286件、Portal 226件、Builder 14件、TypeScript及びVite Buildが合格した。
