# 最終受入一覧

| 項目 | 状態 | 証拠 |
|---|---|---|
| 各 Shortcut に一つの購読 Icon | Source Test 合格、Browser 未確認 | `ai-assistant-shortcuts.test.ts`、Browser `evidence_missing` |
| 購読後に「新しい話題」直下へ購読区 | Source Test 合格、Browser 未確認 | Source、Browser `evidence_missing` |
| 購読区から専用会話を直接作成 | Source Test 合格 | `createMutation.mutate(shortcut)` |
| ユーザー単位で ID のみ保存 | Source 確認 | localStorage key と物理 ID |
| Portal Test、Build、配信 | 合格 | 35 Files、225 Tests、3850 Modules、`delivery_succeeded` |
| Browser、Console、Screenshot | 未合格 | Browser 接続 Timeout、`evidence_missing` |

Browser 項目が未確認のため、正式 Release Tag は作成しない。
