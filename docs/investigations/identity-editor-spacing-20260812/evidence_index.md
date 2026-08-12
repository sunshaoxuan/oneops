# 証拠索引

| 確認事項 | 証拠 | 状態 |
|---|---|---|
| 原因構造 | `IdentityManagementPage.tsx` のWindows SSO区画直後のロール見出し | 確認済み |
| 標準24px間隔 | `styles.css` の `.windows-identity-editor` | 確認済み |
| 回帰防止 | `identity-editor-spacing.test.ts` | 合格 |
| Portal全量 | 42 Files、250 Tests | 合格 |
| Production Build | TypeScript、Vite 3853 Modules | 合格 |
| Runtime Readiness | `https://192.168.20.54/api/work-center/v1/readiness` が200、`status=UP`、`databaseReady=true` | 合格 |
| 正式配信 | `continuous-delivery.log` の `delivery_succeeded reason=identity-editor-spacing-20260812` | 合格 |
| 配信CSS | `/assets/index-_HqibXMu.css` に24px規則を確認 | 合格 |
| Browser表示 | In-app BrowserはWindows SSO確認表示から遷移せず、Chrome接続なし | evidence_missing |
| Console及びScreenshot | 管理者ユーザー編集画面へ到達できないため取得不可 | evidence_missing |
