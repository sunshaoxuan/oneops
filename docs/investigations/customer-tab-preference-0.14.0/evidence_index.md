# 証拠一覧

| ID | 種別 | Path 又は対象 | 内容 |
|---|---|---|---|
| E01 | 要件 | `docs/CUSTOMER_INFORMATION_REQUIREMENTS.md` | 個人別 Tab 設定と最終受入項目 28 から 31 |
| E02 | 実装 | `app/apps/portal-shell/src/CustomerInformationPage.tsx` | 設定入口、Modal、保存、表示順、表示切替 |
| E03 | 実装 | `app/apps/portal-shell/src/customer-information-utils.ts` | 正規化、移動、表示保護 |
| E04 | Unit Test | `app/apps/portal-shell/src/customer-information.test.ts` | 順序、最低表示数、利用者物理 ID Key |
| E05 | Style | `app/apps/portal-shell/src/styles.css` | Desktop 及び Narrow View |
| E06 | Screenshot | `docs/evidence/customer-tab-preference-0.14.0.png` | Desktop 設定 Modal |
| E07 | Screenshot | `docs/evidence/customer-tab-preference-0.14.0-narrow.png` | 390px 設定 Modal |
| E08 | Runtime | `https://192.168.20.54/customers` | 正式画面で機能操作を確認 |
| E09 | Health | `https://192.168.20.54/api/work-center/v1/health` | `UP`、Version `0.14.0` |
| E10 | Delivery | `app/logs/continuous-delivery.log` | Portal と Version 変更の配信成功 |
