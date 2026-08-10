# 証拠一覧

| ID | 対象 | 証拠 | 状態 |
| --- | --- | --- | --- |
| E01 | 利用者向け文言 | `app/apps/portal-shell/src/AuthPage.tsx` | 確認済み |
| E02 | 表示回帰 | `app/apps/portal-shell/src/auth-ui.test.ts` | 合格 |
| E03 | 認証要件 | `docs/AUTHENTICATION_AND_RBAC_REQUIREMENTS.md` | 更新済み |
| E04 | 自動試験及び Build | `test_results.md` | 合格 |
| E05 | Rolling 配信 | `app/logs/continuous-delivery.log` | 合格 |
| E06 | 実画面 | `docs/evidence/windows-account-auth-label-20260810.png` | 合格 |
| E07 | 公開 Health | `https://192.168.20.54/api/work-center/v1/health` | `UP`、0.16.2 |
| E08 | 公開静的資材 | `html/index.html`、`html/assets/index-CgK6GqT8.js` | 合格 |
| E09 | Nginx 主従復旧 | `logs/nginx.pid`、Process 一覧、HTTPS 100 Request | 合格 |
