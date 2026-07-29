# 証拠索引

| 主張 | 証拠 | 確度 | 制限 |
|---|---|---|---|
| 浮動表示と専用画面は同じ Component Instance を使用する | `App.tsx` の単一 `AiAssistantChat` と `mode` | 高 | なし |
| AI アシスタント画面では右下入口を表示しない | `AiAssistantChat.tsx` の `!pageMode && !open`、認証後ブラウザー | 高 | なし |
| 専用画面は会話履歴を常時表示する | `pageMode || showHistory`、`ai-assistant-history-page`、スクリーンショット | 高 | なし |
| 浮動ウィンドウから専用画面へ移動できる | `onMaximize`、認証後ブラウザー | 高 | なし |
| 正式 URL は `/ai-assistant` | `portal-navigation.ts`、ブラウザー URL | 高 | なし |
| 旧 `/tasks` は新 URL へ移行する | `portalRouteFromPathname`、ブラウザー URL | 高 | なし |
| メニューと画面は `ai.assistant.use` に従う | `App.tsx`、`auth.mjs` | 高 | 権限なし実ユーザーのブラウザー確認は未実施 |
| 権限分配画面に AI アシスタントを表示する | `IdentityManagementPage.tsx`、権限マトリクスのスクリーンショット | 高 | なし |
| CAG プロセスを変更していない | 公開前後の PID 17348 と開始時刻 | 高 | CAG は参照のみ |
