# 試験結果

| 項目 | 結果 | 証拠 |
| --- | --- | --- |
| CAG Task Cancel API | 合格 | `test_tasks_api.py` 19 件 |
| CAG Backend 全試験 | 合格 | 190 件成功、4 件 Skip、Coverage 85.27% |
| CAG Frontend | 合格 | 22 件成功 |
| CAG Production Build | 合格 | TypeScript、Vite |
| CAG Runtime | 合格 | 8000、8001、8002、Version 0.28.4、Ready |
| CAG 実 Task Cancel | 合格 | Leased から Cancelled、Cancelled Event 1、Completed 0、Failed 0 |
| OneOps Gateway、Database、Audit 重点試験 | 合格 | 36 件成功 |
| OneOps Portal 重点試験 | 合格 | 35 件成功 |
| OneOps Portal TypeScript | 合格 | `tsc -b` |
| OneOps Gateway 全試験 | 合格 | 279 件成功 |
| OneOps Worker 全試験 | 合格 | 14 件成功 |
| OneOps Portal 最初の全試験 | 合格 | 213 件成功 |
| OneOps 終端競合返工 対象試験 | 合格 | 1 File、30 件成功 |
| OneOps 終端競合返工 Portal 全試験 | 合格 | 33 File、219 件成功 |
| OneOps Operations Script | 合格 | 9 Script |
| OneOps Spring Backend | 合格 | 40 件、8 件 Skip、Build Success |
| OneOps 返工後 Production Build | 合格 | TypeScript、Vite、3850 Module、`index-Ll7Ak_gu.js`、`index-BQkCaVWd.css` |
| Vitest Worker 起動失敗 | 環境補正済み | 残存 `pnpm check` Process Tree により対象 Test 開始前に Timeout。対象 Tree 除去後に対象試験 30 件と Portal 219 件を先頭から再実行して合格 |
| OneOps 最初の正式配信 | 合格 | SYSTEM Continuous Delivery、Health 0.18.18、Listener、nginx 構文、最初の三層 Asset Hash |
| OneOps 返工後全量 Check | 合格 | Gateway 279 件、Worker 14 件、Portal 219 件、TypeScript、Vite |
| OneOps 返工後 Operations Script | 合格 | 9 Script |
| OneOps 返工後 Spring Backend | 合格 | 40 件、8 件 Skip、Build Success |
| OneOps 返工後正式配信 | 合格 | Commit `7231f36`、SYSTEM Delivery `21:06:44` 成功、Health 0.18.18 |
| OneOps 返工後 Runtime | 合格 | 443、8092、8093、Upstream 8092、nginx 構文、8094 と 8095 の非 Listen |
| OneOps 返工後 Asset | 合格 | `index.html`、`index-Ll7Ak_gu.js`、`index-BQkCaVWd.css` の三層 SHA256 一致 |
| Browser 生成中 Draft | 合格 | TextArea Enabled、Draft 保持、通常文字 Paste、選択、削除、`Shift + Enter` |
| Browser 生成中単一 Task | 合格 | Enter で User Turn 増加 0、画像 File Paste で添付増加 0、Send 0、Stop 1 |
| Browser 生成中添付 Lock | 合格 | 添付 Button Disabled、File Input Disabled |
| Browser Stop 要求中 | 合格 | 停止処理中表示、Draft 保持、送信と添付 Lock 継続 |
| Browser Cancel Route | 合格 | Access Log 一件、HTTP 202、Audit 成功一件 |
| CAG Cancel Task 終端 | 合格 | Task `69c96824`、Cancelled 1、Completed 0、Failed 0、Delta 26 件 |
| Browser Cancelled 表示 | 合格 | 部分回答保持、中立的 Status、Loader 0、失敗 Alert 0、Send と添付復元 |
| Browser Session 隔離 | 合格 | Cancelled 後の B は Draft 空、Stop 0、Error 0。A の Draft と Reply を保持 |
| 停止処理中 Session 切替 | Portal Test 合格、Browser 時間順証拠なし | 背景 SSE、複合 Key、不一致 Event、古い Callback を対象試験で確認。正式 Browser の切替は Cancelled 後 |
| Browser 保持 Draft 再送 | 合格 | User Turn 3 から 4、Message POST 一件、Task `d112c1b5` 一件 |
| CAG 自然完了 Task 終端 | 合格 | Completed 1、Cancelled 0、Failed 0 |
| Browser Reload | 合格 | Cancelled 状態復元、Streaming Loader 0、User Turn 4 |
| Browser Console | 合格 | Error 0、Warning 0 |
| Browser Screenshot | 合格 | 生成中、Stop 中、Cancelled、自然完了の公開可能な四件 |
| Drag and Drop 直接 Browser 操作 | 制約記録済み | 今回使用した Browser 操作 API では File Data を伴う直接注入を実行できなかった。Disabled DOM、File Paste 抑止及び Portal Test で Lock を確認 |
| Git Release Tag | 合格 | Local と Remote の `v0.18.18^{}` が `7231f36` で一致し、現行 `master` の祖先 |
| Task Worktree整理 | 合格 | Detached Worktree登録、依存Junction及び残存Directoryを削除 |
| 後続Runtime互換 | 合格 | HTTPSと8092はHealth `UP`、Version `0.18.19`、`v0.18.18^{}`は祖先 |
