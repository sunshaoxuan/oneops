# 証拠索引

更新日: 2026-08-10

| 主張 | 証拠 | 確度 | 制約 |
|---|---|---|---|
| 主画面の日本語名称は Portal i18n から取得する | `app/apps/portal-shell/src/i18n.ts`、`App.tsx`、公開 Bundle | 高 | 認証後 Browser は `evidence_missing` |
| AI 会話の完全画面と浮動表示は共通 Copy を使用する | `app/apps/portal-shell/src/AiAssistantChat.tsx`、Portal Test、公開 Bundle | 高 | 認証後 Browser は `evidence_missing` |
| 権限マトリクスの資源名と権限名は別の表示辞書を使用する | `app/apps/portal-shell/src/IdentityManagementPage.tsx`、Portal Test | 高 | 認証後 Browser は `evidence_missing` |
| 権限データは再実行型 SQL で現行名称へ更新される | `app/gateway/database.mjs`、Migration 019、020、稼働 Database Query | 高 | なし |
| 個人タスクは Portal 通知と Gateway 保存結果を別々に保持する | `PersonalTasksPage.tsx`、`personal-task-ai.mjs`、行動 Test | 高 | なし |
| 稼働環境は 0.18.3 と SSO 契約を返す | Spring Health、Node Readiness、Auth Config、HTTPS 200 | 高 | なし |
| Edge では内部 HTTP SSO が遮断される | `docs/evidence/ai-assistant-label-0.18.3-edge-sso-blocked-20260810.png` | 高 | OneOps 認証後 UI を確認できない |
| In-app Browser では SSO 確認状態が完了しない | `docs/evidence/ai-assistant-label-0.18.3-iab-sso-pending-20260810.png` | 高 | OneOps 認証後 UI を確認できない |
