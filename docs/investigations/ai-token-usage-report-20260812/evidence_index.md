# 証拠索引

| 確認事項 | 証拠 | 状態 |
|---|---|---|
| 呼出単位Ledger | `app/db/migrations/046_create_ai_token_usage_report.sql` | 確認済み |
| AIアシスタント二段階記録 | `app/gateway/ai-assistant-openai.mjs` | Test確認済み |
| 問合支援記録 | `app/gateway/inquiry-analysis.mjs` | Test確認済み |
| 管理者APIと権限 | `app/gateway/ai-usage-report-routes.mjs`, `app/gateway/auth.mjs` | Test確認済み |
| 管理者画面 | `app/apps/portal-shell/src/AiTokenUsageReportPage.tsx` | Test 229件、Build確認済み |
| 保存済みロールを再変更しない | `permission_seed_enabled` 条件、RBAC Test | 全量再試験で確認済み |
| 正式AI呼出Usage | DatabaseのINTENT_ANALYSIS 964、RESPONSE 1023 Token | 確認済み |
| 正式権限API | SYSTEM_ADMIN 200、VIEWER 403 | 確認済み |
| Browser Console | in-app Browser error 0、warning 0 | 確認済み |
| ログイン後Screenshot | `docs/evidence/ai-token-usage-report-sso-waiting-20260812.png` | SSO待機によりevidence_missing |
