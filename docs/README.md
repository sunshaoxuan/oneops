# OneOps 文書索引

更新日: 2026-07-29

## プロジェクトと開発規約

- [プロジェクト強制規約](PROJECT_RULES.md)
- [バージョン管理](VERSIONING.md)
- [認証と権限の要件](AUTHENTICATION_AND_RBAC_REQUIREMENTS.md)

## 基本台帳と業務機能

- [組織機関要件](ORGANIZATION_DIRECTORY_REQUIREMENTS.md)
- [環境情報要件](ENVIRONMENT_MANAGEMENT_REQUIREMENTS.md)
- [EnvPortal 環境インポート調査](investigations/envportal-import-20260724/investigation_report.md)
- [EnvPortal ユーザー移行調査](investigations/envportal-user-migration-20260724/investigation_report.md)

## 技術文書

- [Web 層 Agent Gateway 技術仕様書](Web%E5%B1%A4Agent%20Gateway%E6%8A%80%E8%A1%93%E4%BB%95%E6%A7%98%E6%9B%B8.docx)
- [AI アシスタント要件](AI_ASSISTANT_REQUIREMENTS.md)
- [AI 設定要件](AI_SETTINGS_REQUIREMENTS.md)
- [問合せ支援要件](INQUIRY_SUPPORT_REQUIREMENTS.md)

## 調査と検証

調査手順、テスト結果、リリース証跡は `docs/investigations/` と `docs/evidence/` に保存します。各記録には対象範囲、方法、結果、制約、再確認可能なパスを記載します。

## 第三者資料

NGINX の原文ライセンスと変更履歴は `docs/LICENSE`、`docs/CHANGES` などの正式ファイルに保存します。ランタイム、ログ、バックアップ、ローカル環境情報は Git 管理対象外です。
