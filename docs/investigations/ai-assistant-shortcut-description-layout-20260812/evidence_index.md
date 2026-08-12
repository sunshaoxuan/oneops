# 証拠索引

| 確認事項 | 証拠 | 状態 |
| --- | --- | --- |
| 発生状態 | 利用者提供画像 | 確認済み |
| DOM と配置規則 | `AiAssistantChat.tsx`、`ai-assistant.css` | 確認済み |
| 共通折返し契約 | `ai-assistant-shortcuts.test.ts`、対象 Vitest 9 項 | 合格 |
| 要件と変更履歴 | `AI_ASSISTANT_SHORTCUTS_REQUIREMENTS.md`、`CHANGELOG.md` | 更新済み |
| 全量品質 | `pnpm check` | Gateway 302、Builder 14、Portal 250、Build 3853 Modules 合格 |
| 配信 Asset | 正式 HTTPS の `index-B0efXYle.css` と `index-DT-Fv3GE.js` | 更新確認済み |
| CSS 契約 | 正式 HTTPS CSS 本文 | `text-wrap:pretty`、`line-break:strict`、本文全幅を確認済み |
| Git 配信元 | `6ec1ff4`、`origin/master` | `6ec1ff4` が最新 `origin/master` の祖先であることを確認済み |
| 正式画面 | 利用者の認証済み Browser | 利用者確認へ移行 |
