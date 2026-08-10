# 証拠索引

更新日: 2026-08-10

| 主張 | 証拠 | 確度 | 制約 |
|---|---|---|---|
| 主画面の日本語名称は Portal i18n から取得する | `app/apps/portal-shell/src/i18n.ts`、`App.tsx` | 高 | Browser 証拠は公開後に追加する |
| AI 会話の完全画面と浮動表示は共通 Copy を使用する | `app/apps/portal-shell/src/AiAssistantChat.tsx` | 高 | Browser 証拠は公開後に追加する |
| 権限マトリクスの資源名と権限名は別の表示辞書を使用する | `app/apps/portal-shell/src/IdentityManagementPage.tsx` | 高 | 稼働 Database と Browser 証拠は公開後に追加する |
| 権限データは再実行型 SQL で現行名称へ更新される | `app/gateway/database.mjs`、Migration 019、020 | 高 | 稼働 Database Query は公開後に追加する |
| 個人タスクは Portal 通知と Gateway 保存結果を別々に保持する | `PersonalTasksPage.tsx`、`personal-task-ai.mjs` | 高 | 関連試験は実装後に追加する |
