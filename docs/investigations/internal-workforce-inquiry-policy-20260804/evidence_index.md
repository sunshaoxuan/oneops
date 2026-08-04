# 証拠索引

| ID | 証拠 | 用途 |
| --- | --- | --- |
| E-01 | `app/db/migrations/009_create_identity_and_rbac.sql` | 既存利用者及び RBAC の確認 |
| E-02 | `app/backend/src/main/java/jp/onehr/oneops/identity/application/IdentityService.java` | 現行認証、利用者、権限の実行経路 |
| E-03 | `app/backend/src/main/java/jp/onehr/oneops/platform/proxy/LegacyGatewayController.java` | 8093 互換転送境界 |
| E-04 | `app/gateway/inquiry-support-routes.mjs` | 実サイト検索及び選択肢 API |
| E-05 | `app/apps/portal-shell/src/InquirySupportPage.tsx` | 固定初期値、検索 Form、担当者選択肢 |
| E-06 | `docs/INTERNAL_WORKFORCE_AND_INQUIRY_SEARCH_POLICY_REQUIREMENTS.md` | 今回の要件正本 |
| E-07 | `app/db/migrations/026_create_internal_workforce_and_inquiry_search_policy.sql` | 物理 ID、外部キー、初期部門、初期職責及び管理権限 |
| E-08 | `app/backend/src/main/java/jp/onehr/oneops/workforce` | Spring 管理 API 及び既定解決 |
| E-09 | `app/backend/src/test/java/jp/onehr/oneops/workforce` | API、解決規則及び実 PostgreSQL 自動ロールバック試験 |
| E-10 | `app/apps/portal-shell/src/WorkforcePolicyPages.tsx` | 二つの独立管理画面 |
| E-11 | `docs/evidence/internal-workforce-management-final-20260804.png` | 正式 Portal の社内部門階層及び職責台帳 |
| E-12 | `docs/evidence/inquiry-search-template-policy-final-20260804.png` | 正式 Portal の Template、五種類の Binding、優先順位及び実サイト担当者値 |
| E-13 | Local Only `docs/evidence/user-workforce-assignment-final-20260804.png` | 正式 Portal の利用者主所属及び部門別職責割当。実利用者一覧を含むため Repository へ登録しない |
| E-14 | `docs/evidence/inquiry-search-default-policy-final-20260804.png` | 正式 Portal の既定元、`TODAY`、自動検索及び検索状態復元 |
| E-15 | Local Only `docs/evidence/inquiry-search-invalid-assignee-final-20260804.png` | 実サイトに存在しない担当者値の失効表示。実問合一覧を含むため Repository へ登録しない |
| E-16 | Local Only `docs/evidence/profile-workforce-readonly-final-20260804.png` | 個人プロフィールの主所属、兼務所属及び業務職責の参照専用表示。背景に実問合一覧を含むため Repository へ登録しない |
| E-17 | `app/db/migrations/015_expand_ai_settings.sql` | Migration 全体再実行時の `INQUIRY` 行保持修正 |
| E-18 | `app/gateway/model-settings.test.mjs` | 旧 Migration 再実行の回帰試験 |
| E-19 | `AGENTS.md` | 当初目的から逐項確認し、修正後に全体再実行する最終受入規則 |
