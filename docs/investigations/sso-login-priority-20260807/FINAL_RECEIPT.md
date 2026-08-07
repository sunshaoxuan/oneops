# 完了回付

## 目的

ドメイン利用者の初回入口を Windows SSO とし、失敗時にユーザー名とパスワードへ回退できる認証動作を復旧する。明示的なログアウトでは同じタブのログイン画面を表示し、SSO ボタンを残したまま自動 SSO の再実行を抑止する。

## 交付物

* `app/scripts/ensure-oneops-runtime.ps1`
* `app/scripts/test-operations-scripts.ps1`
* `app/scripts/install-runtime-supervisor.ps1`
* `docs/RUNTIME_AVAILABILITY.md`
* `docs/PROJECT_RULES.md`
* `docs/AUTHENTICATION_AND_RBAC_REQUIREMENTS.md`
* `docs/investigations/sso-login-priority-20260807/`

## 最終受付

自動テスト、設定 API、Runtime Supervisor、SSO 遷移、ローカル回退、SSO ボタン、明示的なログアウト、ログアウト後の自動 SSO 抑止、ブラウザーコンソール、画面スクリーンショット、HTTPS、Git 配信状態を逐項確認した。実ドメイン資格情報を自動化ブラウザーへ投入していないため、実ドメイン SSO 成功は未確認として残存リスクへ記録する。初回 SSO 待機画面の安定した PNG はブラウザー遷移待機の制約により `evidence_missing` とした。Portal TypeScript と Vite の全体ビルドは現行作業ツリーで合格し、Portal UI テスト 157 件が合格した。

## 現時点の受入結果

| 要求 | 成果物と証拠 | 結果 |
| --- | --- | --- |
| 初回入口を Windows SSO にする | 正式 `auth/config`、Runtime Supervisor の正規値、Portal DOM 遷移 | 合格 |
| SSO 失敗時にユーザー名とパスワードへ戻す | 隔離モックの回跳 URLと DOM スナップショット | 合格 |
| SSO ボタンを表示する | 回退 DOM と `sso-fallback-login.png` | 合格 |
| 明示的なログアウトがセッションを破棄する | ローカル認証フィクスチャの logout API 1 回、未認証 DOM | 合格 |
| ログアウト後にログイン画面と SSO ボタンを残す | `logout-login-page.png`、DOM のユーザー名、パスワード、SSO ボタン | 合格 |
| ログアウト後に自動 SSO を再実行しない | 1.6 秒待機後の URL `/`、SSO 自動要求 0 件 | 合格 |
| 手動 SSO を維持する | ログアウト画面の SSO ボタン、手動要求 1 件 | 合格 |
| 修正後に設定を維持する | Runtime Supervisor 一回巡検、`runtime-supervisor.log` | 合格 |
| 関連テストとビルド | Gateway 205、Python 14、Portal 157、TypeScript、Vite build | 合格 |
| 実ドメイン資格情報で SSO 成功する | 自動化ブラウザーへ資格情報を投入していない | 未確認 |
| 初回待機画面 PNG | ブラウザー遷移待機制約 | `evidence_missing` |
