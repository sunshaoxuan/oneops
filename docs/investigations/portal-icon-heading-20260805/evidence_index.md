# 証跡一覧

| ID | 確認対象 | 証跡 | 判定 |
|---|---|---|---|
| E-01 | ページ見出しの機能アイコン | `app/apps/portal-shell/src/CustomerInformationPage.tsx`、`PersonalTasksPage.tsx` | 合格 |
| E-02 | 管理区画の機能アイコン | `app/apps/portal-shell/src/App.tsx`、`ModelDesignPage.tsx`、`InquirySupportSettingsPage.tsx`、`WorkforcePolicyPages.tsx` | 合格 |
| E-03 | 共通 CSS と窄屏規則 | `app/apps/portal-shell/src/styles.css` | 合格 |
| E-04 | アイコン構造の自動試験 | `app/apps/portal-shell/src/layout.test.ts`、Portal 144 件合格 | 合格 |
| E-05 | Portal 本番ビルド | `app/apps/portal-shell/dist`、Vite production build | 合格 |
| E-06 | 静的公開 | `publish-portal.ps1` の `delivery_succeeded` | 合格 |
| E-07 | 顧客情報のデスクトップ表示 | `docs/evidence/portal-icon-heading-customer-desktop-20260805.png` | 合格 |
| E-08 | 個人タスクのデスクトップ表示 | `docs/evidence/portal-icon-heading-personal-tasks-desktop-20260805.png` | 合格 |
| E-09 | 顧客情報の 640px 表示 | `docs/evidence/portal-icon-heading-customer-640-20260805.png` | 合格 |
| E-10 | Agent Gateway の 640px 表示 | `docs/evidence/portal-icon-heading-agent-gateway-640-20260805.png` | 合格 |
| E-11 | 実ページのブラウザーコンソール | 顧客情報、個人タスク、システム管理、基本台帳、問合支援の各確認で warning と error なし | 合格 |
