# 証拠索引

| 主張 | 証拠 | 確度 | 制約 |
|---|---|---|---|
| AI助手 Card 外側へ不要な文書領域が存在する | 利用者提供 Screenshot | 高 | 変更前の DOM 値は取得できない |
| Content だけが viewport 計算高を持っていた | `app/apps/portal-shell/src/styles.css` の変更前 `portal-content-ai-assistant` | 高 | 静的ソース |
| AI助手選択時だけ祖先 Layout を固定する | `App.tsx` の `portal-main-ai-assistant` 条件付与 | 高 | 単体試験と Browser 実測を併用 |
| 短い会話で文書スクロールが発生しない | Browser 実測 `1245 = 1245` | 高 | ローカル実 Layout fixture |
| 長い会話で会話領域だけがスクロールする | Browser 実測 `document 1245 = 1245`、`conversation 1004 < 2482` | 高 | ローカル実 Layout fixture |
| Browser Console に警告及びエラーがない | Browser Console 0 件 | 高 | ローカル実 Layout fixture |
