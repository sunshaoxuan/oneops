# 証拠一覧

| ID | 確認事項 | 証拠 | 状態 |
|---|---|---|---|
| E01 | 固定 300px が孤立行の原因 | `app/apps/portal-shell/src/ai-assistant.css`、`docs/evidence/ai-assistant-empty-copy-wrapping-before-20260809.png` | 確認済み |
| E02 | レスポンシブ上限と均衡折返し | `ai-assistant.css` | 確認済み |
| E03 | 空状態 Rule の回帰 Test | `ai-assistant-empty-state-layout.test.ts` | 合格 |
| E04 | Portal 全 Test と Build | `test_results.md` | 合格 |
| E05 | Gateway、Worker、Spring、運用 Script | `test_results.md` | 合格 |
| E06 | ログイン後の実画面と Console | Codex App Browser | `evidence_missing` |
