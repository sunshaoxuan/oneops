# 実行記録

1. `git fetch origin master`
2. `rg` による Route、権限、画面実装、要件文書の確認
3. `pnpm exec vitest run src/contextual-help.test.ts src/contextual-help-integration.test.ts src/contextual-help-documents.test.ts`
4. `pnpm --filter @one-ops/portal-shell build`
5. `git diff --check` による差分確認
6. `pnpm --filter @one-ops/portal-shell test`

主作業 Tree の Portal 全 Test は 241 件中 236 件合格、5 件失敗となった。失敗は本タスクの変更対象外である未コミット `AiAssistantChat.tsx` と既存静的契約 Test の不一致に限定された。本タスクを最新 `origin/master` へ適用した隔離作業 Tree で全 Test を再実行する。

7. `origin/master` の `ffd4b41` に本タスクだけを適用した隔離作業 Tree で `pnpm install --frozen-lockfile`
8. 同作業 Tree で聚焦 12 Test、Portal 全 Test、Production Build

隔離作業 Tree の全 Test は基準側 AI Test 3 件が失敗したため、正式配信を保留した。

9. 目次整列修正後に聚焦 12 Test と Production Build を再実行
10. Browser Client で Loopback Preview と Inline Preview を確認し、いずれも Security Policy で遮断されたため Browser 証拠を `evidence_missing` として記録
11. Browser で `https://onehr.jp/` を開き、DOM、Computed Style、Console を確認
12. 四画面の Source、Requirement、Test から Field、Button、Default、Validation、State、Result を抽出
13. 四 Help HTML と共通 CSS を詳細操作 Manual 及び OneHR Design Language へ全面改訂
14. 詳細操作 Contract、Step 数、目次 Link、HTML 構造、OneHR Style を Vitest で検証
15. 聚焦 12 Test、Production Build、`git diff --check`、Portal 全 Test を再実行
16. `origin/master` `2c97c2f` へ Help Commit を Rebase し、Frozen Install、聚焦 Test、Portal 全 Test、Production Build を再実行
