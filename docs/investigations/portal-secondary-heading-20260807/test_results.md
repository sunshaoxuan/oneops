# テスト結果

| 検証 | 結果 | 証拠 |
| --- | --- | --- |
| Portal Shell 単体試験 | 19 ファイル、161 件、失敗 0 | `pnpm --filter @one-ops/portal-shell test --run` |
| Portal Shell Production build | 成功、Vite 8.1.5 | `pnpm --filter @one-ops/portal-shell build` |
| Gateway、Worker、Portal、Spring、Nginx の公開前検査 | 成功、公開スクリプト終了コード 0 | `publish-portal.ps1 -Reason portal-secondary-heading` |
| Desktop Browser DOM、computed style、Console、Screenshot | 二級見出し 22px、字重 700、最小高さ 72px、装飾円 none、Console 0 件 | E-04 |
| 640px Browser DOM、横方向溢れ、Console | `clientWidth=scrollWidth=640`、Console 0 件 | E-05 |
| 正式 HTTPS 認証後 UI | `evidence_missing`、Windows SSO 待ち | E-06 |
