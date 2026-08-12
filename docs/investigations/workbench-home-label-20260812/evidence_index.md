# 証拠索引

| 主張 | 証拠 | 判定 |
| --- | --- | --- |
| 三言語表示名を変更 | `i18n.ts`、`home-labels.test.ts` | 確認済み |
| 内部 Navigation 契約を維持 | `portal-navigation.ts`、`App.tsx` | 確認済み |
| 要件文書を同期 | `PROJECT_RULES.md` | 確認済み |
| Portal 回帰試験 | 35 File、224 Test | 合格 |
| Production Build | Vite Production Build | 合格 |
| 公開 Browser | 認証済み正式 HTTPS の DOM に「ホーム」 | 合格 |
| Browser Console | Error 0、Warning 0 | 合格 |
| Screenshot | 展開済み主ナビゲーションで「ホーム」を確認 | 合格 |
| 中国語及び英語の正式 Browser 切替 | 大量の Real-time DOM 更新中に Browser 操作が Timeout | evidence_missing、Contract Test と公開 Bundle で確認 |
