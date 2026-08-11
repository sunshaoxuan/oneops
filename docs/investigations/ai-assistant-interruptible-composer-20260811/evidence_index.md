# 証拠索引

| 証拠 | 状態 | 内容 |
| --- | --- | --- |
| `investigation_report.md` | 合格 | 調査、契約、実装境界、永続化境界及び正式 Browser 受入 |
| `commands.md` | 合格 | 実行命令、返工、正式配信、Browser 操作及び Git 検証 |
| `test_results.md` | 合格 | CAG、OneOps、返工後 Portal、Build、Runtime、Browser 及び Console |
| `FINAL_ACCEPTANCE_CHECKLIST.md` | 合格 | 当初目的に対する逐項受入 |
| `FINAL_RECEIPT.md` | 合格 | Release と引渡しの最終状態 |
| [OpenAI API Webhook Events](https://developers.openai.com/api/reference/resources/webhooks) | 公式資料 | `response.completed`、`response.cancelled`、`response.failed` の独立終端 Event、確認日 `2026-08-11` |
| CAG Commit `8880e0522e8e18fe0c034ae6426618d7a380ded2` | 合格 | `origin/master` と `v0.28.4^{}` が一致 |
| CAG Runtime 8000、8001、8002 | 合格 | Version `0.28.4`、Readiness `ready`、Cancel Route 202 Schema |
| CAG Task `208e3b78-be7f-4eda-88a6-56b18a1d59fe` | 合格 | Leased Cancel、最終 Cancelled、単一 `task.cancelled` |
| OneOps 最初の全試験 | 合格 | Gateway 279 件、Worker 14 件、Portal 213 件、Spring 40 件中 8 件 Skip |
| OneOps 終端競合返工 | 合格 | Session、Task、試行 ID の複合状態、背景 Stop SSE、終端 Reply 照合、Session 単位 Error |
| OneOps 返工後 Portal | 合格 | 定向 30 件、全 33 File 219 件、TypeScript、Vite |
| OneOps 返工後 Production Build | 合格 | `index-Ll7Ak_gu.js`、`index-BQkCaVWd.css` |
| OneOps 返工後全量 Check | 合格 | Gateway 279 件、Worker 14 件、Portal 219 件、TypeScript、Vite |
| OneOps Operations Script | 合格 | 9 Script、Delivery、Rolling Switch、Recovery、Readiness |
| OneOps 返工後 Spring Backend | 合格 | 40 件、8 件 Skip、Build Success |
| OneOps Application Commit `7231f36a30b3e3349c8f7238ca40f12fe111fd6c` | 合格 | `origin/master` へ Push済み、終端競合修正版 |
| OneOps 返工後正式配信 | 合格 | SYSTEM 配信 `21:06:19` 開始、`21:06:44` 成功、Health 0.18.18 |
| OneOps 返工後正式 Runtime | 合格 | 443、8092、8093、nginx Upstream 8092、構文検査、8094 と 8095 の非 Listen |
| OneOps 返工後 Asset | 合格 | `index.html`、`index-Ll7Ak_gu.js`、`index-BQkCaVWd.css` の Build、配信 Directory、HTTPS SHA256 一致 |
| Browser 生成中 DOM | 合格 | TextArea と Draft 有効、Stop 表示、Send 非表示、添付と File Input 無効 |
| Browser Stop 要求中 DOM | 合格 | 「回答の生成を停止しています」、Draft 保持、送信と添付 Lock 継続 |
| Browser Session 隔離 | 合格 | Cancelled 終端後の Conversation B は Draft 空、Stop 状態 0、Error 0。A へ戻ると Cancelled と Draft を復元 |
| 停止処理中の Session 切替 | Portal Test 合格、Browser 時間順証拠なし | 背景 Stop SSE と Session、Task、試行 ID の競合 Test は合格。正式 Browser の B 切替は Cancelled 終端後 |
| Browser Cancelled DOM | 合格 | 中立的停止 Status、部分回答保持、Loader 0、失敗 Alert 0、Send と添付復元 |
| nginx Access Log `266482` | 合格 | Cancel Route 一件、Task `69c96824-96e2-4073-846b-3b22ba09d8ed`、HTTP 202 |
| nginx Access Log `266504` | 合格 | 保持 Draft の Message POST 一件、HTTP 202 |
| OneOps 操作監査 | 合格 | Stop 成功 HTTP 202 一件、他結果 0 件。Session と Task は Audit Details に保存 |
| CAG Task `69c96824-96e2-4073-846b-3b22ba09d8ed` | 合格 | `cancelled`、Cancelled Event 1、Completed 0、Failed 0、Delta 26 件 |
| CAG Task `d112c1b5-5767-4879-8822-ef9da4413650` | 合格 | `completed`、Completed Event 1、Cancelled 0、Failed 0 |
| Browser 自然完了 | 合格 | User Turn 3 件から 4 件、後続 Task 自然完了、Stop と Loader 0 |
| Browser Reload | 合格 | Cancelled 状態と停止文言を復元、古い Streaming Loader 0 |
| Browser Console | 合格 | Error 0 件、Warning 0 件 |
| `docs/evidence/ai-assistant-interruptible-generating-0.18.18.png` | 合格 | 生成中、SHA256 `0985DD33949A03C12FC2FB41F3B94367C0145B577A5D8A56C555950D2FD512E9` |
| `docs/evidence/ai-assistant-interruptible-stopping-0.18.18.png` | 合格 | Stop 要求中、SHA256 `A7A51A09164A80F0C0F5B6E69D37FBA71ABB2F132D7C227F01B2E180556A76D4` |
| `docs/evidence/ai-assistant-interruptible-cancelled-0.18.18.png` | 合格 | Cancelled、SHA256 `8A84393DA8B310936167EE18DFE5617FB3C7C1B4D6066C423E6B052EDD0AE501` |
| `docs/evidence/ai-assistant-interruptible-natural-complete-0.18.18.png` | 合格 | 自然完了、SHA256 `F73F35EFAAD702780AB28E9BE9E1DE3AE2B50F759B40C976308909292EE652FB` |
| Drag and Drop 直接 Browser 操作 | 制約記録済み | Browser API は File Data 注入を提供しない。File Input Disabled、画像 File Paste 拒否、添付件数不変及び Portal Test で Lock を確認 |
| Git Tag `v0.18.18` | 合格 | LocalとRemoteのPeeled Tagは`7231f36a30b3e3349c8f7238ca40f12fe111fd6c`。現在の`master`と`v0.18.19`の祖先 |
| Task専用Worktree | 合格 | Git登録、依存Junction及び残存Directoryを削除。他のWorktreeとRuntime成果物を保持 |
| 後続Runtime | 合格 | HTTPSと8092はHealth `UP`、Version `0.18.19`。`v0.18.18^{}`を祖先として含む |
