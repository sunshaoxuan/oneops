# 試験結果

| 対象 | 結果 | 詳細 |
|---|---|---|
| Portal 集中試験 | 合格 | `ai-assistant.test.ts` 23 Tests。Conversation Lock、全送信入口、終端復元、Session 隔離 |
| Gateway 集中試験 | 合格 | AIアシスタント、Database、個人タスクの 39 Tests |
| Database 集中試験 | 合格 | Transaction、`FOR UPDATE NOWAIT`、Commit、Rollback、55P03、Release |
| `pnpm check` | 合格 | Gateway 274、Worker 14、Portal 211、TypeScript、Production Build 3850 Modules |
| Backend Maven Test | 合格 | 40 Tests、Failures 0、Errors 0、環境依存 8 Skipped |
| 運用 Script Test | 合格 | 9 Scripts、Atomic Publish、Rolling Switch、Readiness、Recovery |
| 日本語規約 Test | 合格 | 5 Tests。文書、AIアシスタント名称、Version、Source Comment、第三者 Snapshot |
| 正式配信 | 合格 | SYSTEM Continuous Delivery 成功、Health `UP`、Version `0.18.16`、nginx 設定成功 |
| Runtime Port | 合格 | 443、8092、8093 Listen。8094、8095 は非 Listen。Upstream `127.0.0.1:8092` |
| Runtime Asset | 合格 | Production Build、配信 Directory、HTTPS 応答の `index.html`、JS、CSS SHA256 が一致 |
| 正式 Browser 実行中 | 合格 | TextArea、送信、添付、File Input 無効、`aria-busy="true"`、案内表示、Fill と Enter 拒否、User Message 4 件 |
| Conversation 独立性 | 合格 | 別 Conversation は利用可能、実行元へ戻すと Lock 継続 |
| 正式 Browser 終端後 | 合格 | 54 秒で五項目の回答完了。TextArea、添付、File Input 有効、`aria-busy="false"`、案内 0 件、Draft 入力時は送信可能 |
| Browser Console | 合格 | Error 0 件、Warning 0 件 |
| Screenshot | 合格 | AIアシスタント領域だけを保存し、Account 表示を除外した。同じ Message の実行中と終端後はいずれも 1332 x 1032。両方とも PNG Signature を確認 |

Production Build の主要 Asset は `/assets/index-C22j2zAF.js` と `/assets/index-CiTRjCGf.css` である。Vite の既存 Chunk Size Warning は出力されたが、Build の終了 Code は 0 だった。

正式配信三層の SHA256 は次の通りである。

| Resource | SHA256 |
|---|---|
| `index.html` | `C0A122B74245EFE732D95396CB0154C5DF8D8949127982DC2671D205E783BA79` |
| `assets/index-C22j2zAF.js` | `6994ECB9E532170DB27328B00E121BC375973BD7D2BCACA8EA91A0984177EB3D` |
| `assets/index-CiTRjCGf.css` | `D81657324CC09691DA7ABD30624D3A8202B26CB2C8815B955E36D262652F18CB` |

正式 Screenshot の SHA256 は `single-flight-locked-0.18.16.png` が `6EE036111F86B88156DC0B485BE7C80D5E79D4430903E3ABEB5E372A8816D9CB`、`single-flight-terminal-0.18.16.png` が `24B77C47AA066ACBBA224951D901DC0CEFAA3B64B37299D4A8D0882E068791D6` である。両 Screenshot は同じ受入 Conversation の同じ Message に対する実行中 Lock と終端復元の連続状態証拠として使用する。
