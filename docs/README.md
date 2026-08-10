# OneOps 文書索引

更新日: 2026-08-06

## プロジェクトと開発規約

- [プロジェクト強制規約](PROJECT_RULES.md)
- [バージョン管理](VERSIONING.md)
- [認証と権限の要件](AUTHENTICATION_AND_RBAC_REQUIREMENTS.md)
- [代理ログイン要件](IMPERSONATION_LOGIN_REQUIREMENTS.md)
- [常時稼働運用](RUNTIME_AVAILABILITY.md)
- [ローリング配信要件](ROLLING_DEPLOYMENT_REQUIREMENTS.md)
- [ローリング配信 調査及び実装記録](investigations/rolling-deployment-20260805/investigation_report.md)

## 基本台帳と業務機能

- [社内部門・業務職責・問合検索既定方針 要件](INTERNAL_WORKFORCE_AND_INQUIRY_SEARCH_POLICY_REQUIREMENTS.md)
- [利用者状態表示要件](USER_STATUS_DISPLAY_REQUIREMENTS.md)
- [利用者編集画面識別要件](USER_EDITOR_IDENTIFICATION_REQUIREMENTS.md)
- [利用者状態表示ローカライズ調査記録](investigations/user-status-localization-20260805/investigation_report.md)
- [社内部門及び問合検索方針 検証記録](investigations/internal-workforce-inquiry-policy-20260804/investigation_report.md)
- [組織機関要件](ORGANIZATION_DIRECTORY_REQUIREMENTS.md)
- [基本台帳要件](BASIC_MASTER_MANAGEMENT_REQUIREMENTS.md)
- [顧客情報要件](CUSTOMER_INFORMATION_REQUIREMENTS.md)
- [カスタマイズ情報 Tab 0.12.0 実装・受入記録](investigations/customer-customization-tab-0.12.0/investigation_report.md)
- [顧客情報統合 調査及び実装記録](investigations/customer-information-20260805/investigation_report.md)
- [環境情報要件](ENVIRONMENT_MANAGEMENT_REQUIREMENTS.md)
- [個人タスク要件](PERSONAL_TASKS_REQUIREMENTS.md)
- [外部タスク設定要件](EXTERNAL_TASK_SETTINGS_REQUIREMENTS.md)
- [個人タスク 0.7.0 実装・受入記録](investigations/personal-tasks-20260731/investigation_report.md)
- [個人タスク 0.7.1 長期タスク発動条件記録](investigations/personal-tasks-long-term-optional-20260731/investigation_report.md)
- [個人タスク候補検索条件 調査記録](investigations/personal-task-candidate-query-20260806/investigation_report.md)
- [問合 AI 補助履歴の生成者と論理削除 0.15.7 実装記録](investigations/inquiry-ai-history-ownership-delete-20260807/investigation_report.md)
- [削除済み問合 AI 補助履歴の管理者表示 0.15.8 実装記録](investigations/inquiry-ai-deleted-history-icons-20260807/investigation_report.md)
- [AI助手の利用者向け一般表現 0.15.9 実装記録](investigations/ai-assistant-generic-user-copy-20260807/investigation_report.md)
- [AI助手空状態文言の孤立行修正 0.16.1 調査・実装記録](investigations/ai-assistant-empty-copy-wrapping-20260809/investigation_report.md)
- [AIアシスタント名称統一 0.18.3 調査・実装記録](investigations/ai-assistant-label-20260810/investigation_report.md)
- [個人タスク候補検索条件 0.10.1 実装・受入記録](investigations/personal-task-candidate-generation-20260806/investigation_report.md)
- [ロール権限伝播と機能横断監査 0.7.5 検証記録](investigations/rbac-role-permission-propagation-20260803/investigation_report.md)
- [ロール権限初期値の再適用防止 2026-08-07 調査及び実装記録](investigations/rbac-permission-reset-20260807/investigation_report.md)
- [Windows SSO 優先とローカル回退 2026-08-07 調査記録](investigations/sso-login-priority-20260807/investigation_report.md)
- [ロール権限マトリクス レスポンシブ改善 0.7.6 検証記録](investigations/role-permission-matrix-usability-20260729/investigation_report.md)
- [代理ログイン後の環境白画面 0.8.2 検証記録](investigations/impersonation-environment-white-screen-20260803/investigation_report.md)
- [ワークベンチ構築履歴復旧 0.8.3 検証記録](investigations/workbench-recent-build-tasks-20260803/investigation_report.md)
- [Spring Boot SSO 設定契約復旧 0.8.7 検証記録](investigations/sso-spring-config-regression-20260804/investigation_report.md)
- [EnvPortal 環境インポート調査](investigations/envportal-import-20260724/investigation_report.md)
- [EnvPortal ユーザー移行調査](investigations/envportal-user-migration-20260724/investigation_report.md)

## 技術文書

- [Spring Boot バックエンド詳細設計書](SPRING_BOOT_BACKEND_DETAILED_DESIGN.md)
- [thinking-orbs 進行表示統合方針](THINKING_ORBS_PROGRESS_DISPLAY.md)
- [Web 層 Agent Gateway 技術仕様書](Web%E5%B1%A4Agent%20Gateway%E6%8A%80%E8%A1%93%E4%BB%95%E6%A7%98%E6%9B%B8.docx)
- [AIアシスタント要件](AI_ASSISTANT_REQUIREMENTS.md)
- [AI 設定要件](AI_SETTINGS_REQUIREMENTS.md)
- [問合せ支援要件](INQUIRY_SUPPORT_REQUIREMENTS.md)

## 調査と検証

調査手順、テスト結果、リリース証跡は `docs/investigations/` と `docs/evidence/` に保存します。各記録には対象範囲、方法、結果、制約、再確認可能なパスを記載します。

## 第三者資料

NGINX の原文ライセンスと変更履歴は `docs/LICENSE`、`docs/CHANGES` などの正式ファイルに保存します。ランタイム、ログ、バックアップ、ローカル環境情報は Git 管理対象外です。
