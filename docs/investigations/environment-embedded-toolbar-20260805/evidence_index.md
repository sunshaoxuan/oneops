# 証拠索引

更新日: 2026-08-05

| ID | 主張 | 証拠 | 確度 | 制限 |
|---|---|---|---|---|
| E-01 | 大型 Header を軽量 Toolbar に変更した | `app/apps/portal-shell/src/EnvironmentPage.tsx` | 高 | なし |
| E-02 | 大型 Card 用 CSS を削除し、小型 Filter 用 CSS を追加した | `app/apps/portal-shell/src/styles.css` | 高 | なし |
| E-03 | 大見出しの非表示、Filter、追加操作を試験した | `environment-page.test.ts`、`EnvironmentPage.viewer.test.tsx` | 高 | 実ブラウザとは別の自動試験 |
| E-04 | Portal、Gateway、Builder の全試験が成功した | `test_results.md` | 高 | なし |
| E-05 | Spring 試験が成功した | `app/backend/target/surefire-reports`、`test_results.md` | 高 | DB 接続を要する 7 件は Skip |
| E-06 | Production Build と正式静的配信が一致した | `dist/index.html` と HTTPS `index.html` の比較結果 | 高 | 画面操作は未確認 |
| E-07 | 正式 Backend は 0.9.3 で稼働中である | `/api/work-center/v1/health` | 高 | 0.9.4 Rolling 配信は未実施 |
| E-08 | 実ブラウザ検証は接続制約で未完了である | Browser の `ERR_CONNECTION_REFUSED` と Browser 接続確認結果 | 高 | Screenshot と Console 証拠なし |
