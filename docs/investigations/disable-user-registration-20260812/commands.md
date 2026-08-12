# 実行コマンド記録

作業ディレクトリは `D:\nginx`。今回の作業は 2026-08-12 に開始し、各回のログは `D:\workspace\codex-logs\disable-user-registration-20260812` に保存する。

## 調査

```text
git status --short
git rev-parse HEAD
git rev-parse origin/master
rg -n -i "register|registration|用户注册|ユーザー登録" app/apps app/backend app/gateway docs
```

## 検証

```text
D:\nginx\runtime\node\pnpm.cmd test
D:\nginx\runtime\node\pnpm.cmd build
app\backend\mvnw.cmd test
git diff --check
```

今回の再検証では認証 UI 対象テスト 6 件、Gateway Auth Controller 12 件、Spring 41 件が成功した。Portal パッケージ全量テストは 234 件成功、1 件失敗、1 Suite 読み込み失敗となった。失敗は並行作業の AI Assistant 変更に起因し、登録停止対象の認証 UI には影響しない。Spring は 8 件 Skip だった。

## 実行時

```text
https://192.168.20.54/
```

ログイン画面に「ユーザー登録」入口がないこと、Console error と warning が 0 件であることを確認し、`docs/evidence/disable-user-registration-20260812.png` を保存した。公開登録 API は `403 REGISTRATION_DISABLED` を返すことを確認した。

Screenshot 保存前にユーザー名とパスワード入力欄を `verification-user` と `redacted-password` に置換し、実アカウント情報を証拠へ残さないようにした。

通常の rolling 配信は Nginx reload の `OpenEvent` Access denied で停止したため、`-SkipChecks -SkipGatewayRestart` の静的配信を実行し、`delivery_succeeded reason=disable-user-registration-20260812-static` を確認した。
