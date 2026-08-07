# 証拠一覧

| ID | 種別 | Path 又は対象 | 内容 |
|---|---|---|---|
| E01 | 要件 | `docs/CUSTOMER_INFORMATION_REQUIREMENTS.md` | 管理者専用画面と権限境界 |
| E02 | UI | `CustomerInformationPage.tsx` | Scan UI と API 呼出の削除 |
| E03 | UI | `CustomerKnowledgeSettingsPage.tsx` | Code 順の組織機関選択と管理画面構成 |
| E04 | UI | `CustomerKnowledgeScanPanel.tsx` | Scan、再取込、再分析、候補確認 |
| E05 | Permission | `gateway/auth.mjs` | 全 Scan Path の管理者権限統一 |
| E06 | Permission | `gateway/customer-information-routes.mjs` | Route 内の管理者権限再検査 |
| E07 | Test | `customer-information.test.ts` | 顧客画面からの分離と管理画面配置 |
| E08 | Test | `customer-knowledge-admin-boundary.test.mjs` | 旧 Scan と Review 権限の不使用 |
| E09 | Screenshot | `docs/evidence/customer-information-without-scan-0.15.0.png` | 顧客情報画面に Scan がない状態 |
| E10 | Screenshot | `docs/evidence/customer-knowledge-admin-separation-0.15.0.png` | Desktop 管理者画面 |
| E11 | Screenshot | `docs/evidence/customer-knowledge-admin-separation-0.15.0-narrow.png` | 390px 管理者画面 |
