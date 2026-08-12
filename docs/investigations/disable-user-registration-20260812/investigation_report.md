# 未認証ユーザー登録一時停止調査

## 調査対象

ユーザー指摘画像のログイン画面に表示される「ユーザー登録」入口と、対応する公開登録 API を確認した。

## 実装前の経路

Portal の `AuthPage.tsx` は login と register の二つの表示モードを持ち、登録モードから API Client の `registerLocalAccount` を呼び出していた。Gateway は `POST /api/work-center/v1/auth/register` で `repository.registerLocal` を実行し、Spring Backend も同じパスで `IdentityService.register` を実行していた。

## 変更後の契約

1. 未認証ログイン画面は既存ローカルアカウントログインと Windows SSO のみを表示する。
2. Portal から自己登録 API Client と登録フォームを削除する。
3. Gateway の公開登録経路は `403`、Code `REGISTRATION_DISABLED`、Message `Self-registration is temporarily disabled` を返す。
4. Spring Backend の公開登録経路も同じ業務エラーを返す。
5. 公開登録要求はユーザー作成サービスを呼び出さず、登録監査を書き込まず、セッションを発行しない。
6. 管理者ユーザー管理の `POST /auth/users` と Windows SSO 自動作成は引き続き利用できる。

## 原因と境界

「一時停止」は未認証ユーザーの自己登録へ適用する。システム管理者によるユーザー追加と Windows SSO 自動作成は別の認可境界として既存実装を維持する。

## 再検証と制限

認証 UI 対象テストは 6 件成功し、Gateway Auth Controller は 12 件成功した。Spring Backend は 41 件成功、8 件 Skip だった。Portal パッケージ全量テストは 234 件成功、1 件失敗、1 Suite 読み込み失敗となった。失敗は並行作業の AI Assistant 変更によるもので、登録停止経路の対象テストは成功している。

正式 HTTPS 画面はログイン入口と Windows SSO 入口を表示し、3 言語の登録入口を表示しない。Console error と warning は 0 件だった。8092 Health は 200、Backend `0.18.20` はオンライン、公開登録 API は 403 `REGISTRATION_DISABLED` だった。最終 Screenshot の入力値は脱敏済みである。
