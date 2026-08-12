# 試験結果

| 対象 | 結果 | 証拠 |
|---|---|---|
| Auth、Auth Controller、Identity Repository | 31 件成功 | Node 対象試験 |
| Portal Auth UI 及び Layout | 35 件成功 | クリーン候補 `359858b1` の Vitest 対象試験 |
| Gateway 全量 | 298 件成功 | クリーン候補 `359858b1` の Node 全量試験 |
| Portal 全量 | 224 件成功、8 件失敗 | AIアシスタントの並行変更で Source と Test が不一致。本タスク対象試験は成功 |
| Portal TypeScript | 失敗 | AIアシスタント契約 8 件及びクリーン Worktree の Design Token 依存解決 1 件 |
| Portal Production Build | 未完了 | TypeScript 失敗のため未達 |
| Diff Check | 成功 | 独立 Git Index の `git diff --cached --check` |

## 未実施項目

実 DB Index、管理者画面、実 Binding 及び Audit は未実施とする。正式 Browser は Windows SSO 確認待機画面まで到達し、Console Error と Warning は 0 件、Screenshot は保存済みである。HTTPS Health は `UP 0.18.20`、未認証 Binding API は `401 AUTHENTICATION_REQUIRED` を確認した。Windows Identity の実データ変更は未実施とする。
