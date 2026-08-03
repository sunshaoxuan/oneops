# 検証結果

実施日: 2026-08-03

## 単体テスト

`app/backend` で `mvnw.cmd -q test` を実行した。

- Spring Boot テスト: 成功
- `IdentityServiceTest`: 成功
- PostgreSQL 配列を `List<String>` に変換した JSON の検証: 成功

## アプリケーション検証

`pnpm check` を実行した。

- Gateway テスト: 147 件成功
- Portal テスト: 120 件成功
- Worker テスト: 7 件成功
- Portal 本番ビルド: 成功
- ロール取得エラー表示と再試行操作を含む Portal 本番アセット公開: 成功

## 稼働検証

- Spring Boot JAR 再作成: 成功
- `OneHR Operations Compat Gateway` 再起動: 成功
- `http://127.0.0.1:8092/api/work-center/v1/health`: `status=UP`
- 稼働データベースのロール取得: 3 ロール、20 権限
- Jackson JSON 化: 4668 バイト、成功
- ロール権限コードの応答: `OPERATOR`、`SYSTEM_ADMIN`、`VIEWER` の各配列を確認

データ変更を伴う SQL は実行していない。
