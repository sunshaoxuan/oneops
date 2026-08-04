# 証跡索引

| 証跡 | パスまたは確認先 | 結果 |
| --- | --- | --- |
| Spring SSO 設定 | `app/backend/src/main/java/jp/onehr/oneops/identity/web/AuthController.java` | EnvPortal と署名代理の既存契約を復旧 |
| Spring 回帰試験 | `app/backend/src/test/java/jp/onehr/oneops/identity/web/AuthControllerConfigTest.java` | 完全設定、不足設定、手動 SSO、署名代理を検証 |
| Runtime Supervisor | `app/scripts/ensure-oneops-runtime.ps1` | SSO URL、プロファイル URL、自動ログインを一括復旧 |
| 正式設定 API | `http://127.0.0.1:8092/api/work-center/v1/auth/config` | URL を含む有効な設定を返却 |
| 正式 health | `http://127.0.0.1:8092/api/work-center/v1/health` | `UP`、`0.8.7` |
| 正式 HTTPS | `https://192.168.20.54/` | HTTP 200、認証済み画面表示 |
