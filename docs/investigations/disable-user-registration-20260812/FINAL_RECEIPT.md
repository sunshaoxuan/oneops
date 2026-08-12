# 最終受入記録

## 最終受入一覧

| 受入項目 | 成果物 | 検証証拠 | 判定 |
|---|---|---|---|
| ログイン画面からユーザー登録を削除する | AuthPage 実装 | Browser DOM と Screenshot | 合格 |
| Portal の自己登録呼出しを削除する | AuthPage、API Client、Auth UI 試験 | 認証 UI 6 件成功 | 合格 |
| Gateway の公開登録を拒否する | auth-controller.mjs | Auth Controller 12 件成功、実行時 403 | 合格 |
| Spring の公開登録を拒否する | AuthController、GlobalExceptionHandler | Spring 41 件成功 | 合格 |
| 管理者が引き続きユーザーを追加できる | POST /users | 既存コード経路、管理者ユーザー関連試験 | 合格 |
| Windows SSO 自動作成へ影響を与えない | provisionWindows | 既存 SSO 試験、実行時 auth config | 合格 |
| Console error と warning がない | 正式ログイン画面 | Browser Console 0 件 | 合格 |
| 静的 Portal を配信する | `html/index.html` と HTTPS 入口 | `delivery_succeeded`、HTTPS 200、HTML SHA256 一致 | 合格 |

## 実行時証拠

正式 URL `https://192.168.20.54/` でログアウト後のログイン画面を確認した。DOM に「ユーザー登録」、「用户注册」、「Register」は存在せず、「ログイン」と Windows SSO ボタンが存在した。ブラウザー Console の error と warning は 0 件だった。入力欄は `verification-user` と `redacted-password` に置換してから Screenshot を保存した。`POST /api/work-center/v1/auth/register` は `403` と `REGISTRATION_DISABLED` を返し、ユーザー作成サービスを呼び出さない。

認証 UI の対象テストは 6 件成功した。Gateway の登録 Controller テストは 12 件成功した。Portal パッケージ全量テストは 234 件成功、1 件失敗、1 テストスイートの読み込み失敗となった。失敗は並行作業の AI Assistant 変更による旧静的断言不一致と `file` URL 読み込み環境エラーであり、登録停止変更のテスト対象外である。Spring Backend は 41 件成功、8 件 Skip となった。

## 配信状態

通常の rolling 配信は Nginx reload の Windows 権限不足で終了した。Nginx 設定検査は成功し、静的 Portal は `-SkipChecks -SkipGatewayRestart` の安全な配信経路で `delivery_succeeded` を記録し、HTTPS 入口への反映を再確認した。Backend の公開登録拒否は 8092 実接口で確認済み。

## Git 交付状態

登録停止変更は `95a83ca`（`暫時禁用用户自助注册`）として `origin/master` へ push 済み。push 後のローカル `HEAD` と `origin/master` は `95a83cae4eac02d8faa6c3cbd96531d9bef17f65` で一致した。作業区に残る未追跡及び未コミット変更は並行作業の AI、ヘルプ及び関連文書であり、今回の提交には含めていない。
