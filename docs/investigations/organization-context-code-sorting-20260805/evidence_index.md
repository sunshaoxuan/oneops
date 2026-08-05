# 証拠索引

更新日: 2026-08-05

| ID | 主張 | 証拠 | 状態 |
|---|---|---|---|
| E-01 | 候補生成前に機関 Code を昇順比較する | `app/apps/portal-shell/src/App.tsx` | 確認済み |
| E-02 | 元の組織機関配列を変更しない | `app/apps/portal-shell/src/App.tsx` の配列コピー | 確認済み |
| E-03 | Code、正式名称、略称検索を維持する | `app/apps/portal-shell/src/layout.test.ts`、`app/apps/portal-shell/src/utils.test.ts` | 確認済み |
| E-04 | 表示順要件を文書化する | `docs/ORGANIZATION_CONTEXT_REQUIREMENTS.md` | 確認済み |
| E-05 | 全試験及び Build が成功する | `test_results.md` | 確認済み |
| E-06 | 配信済み Nginx が新しい Bundle を返す | `test_results.md` | 確認済み |
| E-07 | 実画面の候補が Code 昇順になる | `docs/evidence/organization-context-code-sort-20260805.png` | 確認予定 |
| E-08 | 実画面のコンソールに Error がない | `test_results.md` | 確認予定 |
