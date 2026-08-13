# 最終受入一覧

| No. | 原要求及び制約 | 成果物 | 検証証拠 | 判定 |
|---|---|---|---|---|
| 1 | 個人設定へ最小化項目を追加する | ProfileDialog、三言語文言 | Portal Test 合格、認証済み Browser 未確認 | evidence_missing |
| 2 | 一度の設定ですべての大見出しへ適用する | PortalPageHeroProvider、全 6 入口 | Source、DOM Test 合格、認証済み Browser 未確認 | evidence_missing |
| 3 | 面包屑だけを表示して空間を節約する | PortalPageHero compact 出力 | nav、ol、aria-current DOM Test 合格、Screenshot 未取得 | evidence_missing |
| 4 | 画面ごとの設定を設けない | Profile の単一 Checkbox | Source 及び Test | 合格 |
| 5 | 利用者単位で保存する | users 物理利用者行、Profile API | 実 DB、API Test、Session Contract 合格、実利用者保存未確認 | evidence_missing |
| 6 | 既存画面操作を失わない | 独立 compact actions | DOM Test 合格、認証済み Browser 未確認 | evidence_missing |
| 7 | 文書、試験、公開及び実 UI 証拠を揃える | 要件、Changelog、調査記録 | 全量 Test、配信、Health 合格、UI Screenshot 未取得 | evidence_missing |
