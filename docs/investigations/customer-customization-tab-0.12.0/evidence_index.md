# 証拠一覧

| ID | 確認事項 | 証拠 | 結果 |
| --- | --- | --- | --- |
| E01 | 七つの Tab と順序 | `CustomerInformationPage.tsx`、Portal Test | 合格 |
| E02 | 三言語表示 | `CustomerInformationPage.tsx`、`customer-information.test.ts` | 合格 |
| E03 | 要件記録 | `CUSTOMER_INFORMATION_REQUIREMENTS.md`、`PROJECT_RULES.md` | 合格 |
| E04 | Portal 全試験 | Gateway 200、Builder 14、Portal 154 | 合格 |
| E05 | Spring Test | 33 件成功、7 件 Skip | 合格 |
| E06 | Production Build | `assets/index-mnao5iAm.js` | 合格 |
| E07 | 正式 Asset 一致 | Public と Local の Asset Path 一致 | 合格 |
| E08 | 正式 Health | `UP`、Version `0.12.0` | 合格 |
| E09 | Desktop UI | `docs/evidence/customer-customization-tab-0.12.0.png` | 合格 |
| E10 | Narrow UI | `docs/evidence/customer-customization-tab-0.12.0-narrow.png` | 合格 |
| E11 | Page Overflow | Desktop 1897/1897、Narrow 375/375 | 合格 |
| E12 | Browser Console | Error 0、Warning 0 | 合格 |
| E13 | 手動追加配信 | Nginx Reload Event Access Denied と Index Rollback | 失敗記録済み |
| E14 | 常駐配信 | 08:16:01 の `delivery_succeeded` と正式再検証 | 合格 |
