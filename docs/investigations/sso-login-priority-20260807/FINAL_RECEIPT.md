# 完了回付

## 目的

ドメイン利用者の初回入口を Windows SSO とし、失敗時にユーザー名とパスワードへ回退できる認証動作を復旧する。

## 交付物

* `app/scripts/ensure-oneops-runtime.ps1`
* `app/scripts/test-operations-scripts.ps1`
* `app/scripts/install-runtime-supervisor.ps1`
* `docs/RUNTIME_AVAILABILITY.md`
* `docs/PROJECT_RULES.md`
* `docs/investigations/sso-login-priority-20260807/`

## 最終受付

自動テスト、設定 API、Runtime Supervisor、SSO 遷移、ローカル回退、SSO ボタン、ブラウザーコンソール、回退スクリーンショット、HTTPS、Git 配信状態を逐項確認した。実ドメイン資格情報を自動化ブラウザーへ投入していないため、実ドメイン SSO 成功は未確認として残存リスクへ記録する。初回 SSO 待機画面の安定した PNG はブラウザー遷移待機の制約により `evidence_missing` とした。

## 現時点の受入結果

| 要求 | 成果物と証拠 | 結果 |
| --- | --- | --- |
| 初回入口を Windows SSO にする | 正式 `auth/config`、Runtime Supervisor の正規値、Portal DOM 遷移 | 合格 |
| SSO 失敗時にユーザー名とパスワードへ戻す | 隔離モックの回跳 URLと DOM スナップショット | 合格 |
| SSO ボタンを表示する | 回退 DOM と `sso-fallback-login.png` | 合格 |
| 修正後に設定を維持する | Runtime Supervisor 一回巡検、`runtime-supervisor.log` | 合格 |
| 関連テストとビルド | Gateway 205、Python 14、Portal 154、build | 合格 |
| 実ドメイン資格情報で SSO 成功する | 自動化ブラウザーへ資格情報を投入していない | 未確認 |
| 初回待機画面 PNG | ブラウザー遷移待機制約 | `evidence_missing` |
