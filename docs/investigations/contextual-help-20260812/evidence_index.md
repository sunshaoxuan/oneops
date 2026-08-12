# 証拠索引

| 主張 | 証拠 | 状態 |
|---|---|---|
| 四画面の Route と権限が確定している | `app/apps/portal-shell/src/portal-navigation.ts` | 確認済み |
| 問合支援の現行契約に沿う | `docs/INQUIRY_SUPPORT_REQUIREMENTS.md` | 確認済み |
| AI アシスタントの現行契約に沿う | `docs/AI_ASSISTANT_REQUIREMENTS.md` | 確認済み |
| 製品構築の現行契約に沿う | `docs/PRODUCT_BUILDER_REQUIREMENTS.md`、`app/builder/host_standalone_console.py` | 確認済み |
| 基本台帳の現行契約に沿う | `docs/BASIC_MASTER_MANAGEMENT_REQUIREMENTS.md` | 確認済み |
| Route ごとの Link が固定される | `app/apps/portal-shell/src/contextual-help.test.ts` | 7 Test 合格 |
| 文書の基本要素が固定される | `app/apps/portal-shell/src/contextual-help-documents.test.ts` | 5 Test 合格 |
| Header 入口契約が固定される | `app/apps/portal-shell/src/contextual-help-integration.test.ts` | 1 Test 合格 |
| Production Build に文書が同梱される | Portal Vite Build の `dist/help` | 確認済み |
| 最新基準で本タスク聚焦試験と Build が合格する | `test_results.md` | 確認済み |
| Portal 全 Test | `test_results.md` | 基準側 AI Test 3 件失敗 |
| Browser 表示、Console、Screenshot | 全 Test 合格後の正式 HTTPS 配信 | 検証待ち |
| 目次 Marker、Padding、基線及び狭幅一列を Style 契約で固定する | `app/apps/portal-shell/src/contextual-help-documents.test.ts` | 12 Test 合格 |
| onehr.jp の現行 Design Language | `https://onehr.jp/` Browser DOM と Computed Style、2026-08-12 | 背景、本文色、Font、Accent、Radius 確認済み |
| 四文書が現行画面の Label と操作 Contract を含む | `contextual-help-documents.test.ts`、四 Help HTML | 12 Test 合格 |
| 目次 Link が全て実在 Section を指す | HTML 構造検査 | 4 文書合格 |
| 詳細操作量 | 四 Help HTML の Section、Step、Table 集計 | 31 区画、97 Step、10 Table |
| 最新 origin/master の Build Gate | `test_results.md`、`2c97c2f` 隔離 Build | 基準側 AI TypeScript Error 8 件 |
