# 最終受入チェックリスト

基準日: 2026-08-08

| 項目 | 成果物 | 検証証拠 | 判定 |
| --- | --- | --- | --- |
| 実際の入口を明示する | システム管理の単一メニュー | Portal source、公開 JS | 合格 |
| 顧客情報ページから管理権限者だけが入口へ移動できる | Hero の CAG 分析ボタン | Portal source、Portal テスト、公開 JS | 合格 |
| 選択組織機関を引き継ぐ | `initialOrganizationId` | Source、Portal テスト、公開 JS | 合格 |
| 権限マトリクスと実入口を同じ表現にする | 三言語 resource label | Portal source、Portal テスト、公開 JS | 合格 |
| 旧 scan/review を表示及び保存対象から除外する | Permission matrix filter と role save filter | 173 Portal テスト | 合格 |
| 顧客情報ページへ CAG 操作を戻さない | Scan boundary test | `customer-information.test.ts` | 合格 |
| API の管理権限境界を維持する | Gateway route checks | Gateway 218 件 | 合格 |
| 公開版で稼働する | 公開ログ、health、HTTPS | `delivery_succeeded`、health `UP`、HTTPS 200 | 合格 |
| Console にエラーがない | Browser Console | 公開後 Browser | 未確認 |
| 変更後画面を保存する | Browser screenshot | 公開後 Browser | 未確認 |

## 受入判断

静的テスト、ビルド及び公開は合格した。認証後 Browser の入口クリック、Console、スクリーンショットは、SSO 認証待ちで Workbench に到達できず未確認とする。
