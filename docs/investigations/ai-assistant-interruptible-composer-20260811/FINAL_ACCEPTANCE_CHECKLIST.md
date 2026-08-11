# 最終受入一覧

最終受入は当初目的から逐項実行する。一項でも不合格の場合は修正後に第 1 項から再実行する。

| No. | 当初目的又は制約 | 成果物 | 状態 |
| --- | --- | --- | --- |
| 1 | 生成中も次回 Draft を入力、編集、削除できる | Portal Composer、Browser DOM | 合格。TextArea Enabled、Draft 保持、選択、削除、Backspaceを確認 |
| 2 | 通常文字 Paste と Shift + Enter を利用できる | Portal Handler、Browser 操作 | 合格。通常文字 Paste と改行を実 Browser で確認 |
| 3 | Enter、Click、直接 API で二件目を作成しない | Submission Ref、Gateway DB Lock、Task 件数 | 合格。Enter 増加 0、保持 Draft 再送は User Turn と Message POST 各一件、Gateway 原子 Lock Test 合格 |
| 4 | 生成中は Send 位置へ実心四角 Stop を表示する | Portal、CSS、ARIA、Screenshot | 合格。Send 0 件、Stop 1 件、生成中 Screenshot |
| 5 | Stop は選択時の最新 Task だけを対象にする | Gateway Lock、Ownership Test | 合格 |
| 6 | Stop の二重 Click を一件に限定する | Task ID Set と同期 Ref、Portal Test | 合格 |
| 7 | Stop HTTP 202 後も SSE と送信 Lock を維持する | Portal State、Network、SSE | 合格。Stop 中 Screenshot、Cancel 202 一件、同 Task SSE が Cancelled 終端まで継続 |
| 8 | CAG が実際の Runtime を停止して task.cancelled を一件生成する | CAG Runtime Task | 合格 |
| 9 | 部分回答と Draft を保持し、失敗と停止を分離する | Reply Reducer、Browser DOM | 合格。部分回答と Draft 保持、中立的 Status、失敗 Alert 0 |
| 10 | Stop 失敗時は SSE 継続、Draft 保持、再試行可能 | Portal Error State、Test | 合格。Session、Task、試行 ID の Error State Testで確認 |
| 11 | Session 間で Draft、Task、Reply、Stop を混在させない | Session State、Browser 二 Session | 合格。Cancelled 後の二 Session 実測と、停止処理中の背景 SSE 競合 Testを組み合わせて確認 |
| 12 | 自然完了経路と終端後 Send 復元を維持する | Portal Test、Browser | 合格。後続 Task `d112c1b5` は Completed 1、Cancelled 0、Failed 0 |
| 13 | CAG 0.28.4 の API、文書、Version、Runtime を揃える | CAG Commit、Tag、Health | 合格 |
| 14 | OneOps 0.18.18 の要件、Changelog、Version を揃える | 正式文書と Version File | 合格 |
| 15 | Portal、Gateway、Worker、Backend、Operations Test を合格させる | 全試験結果 | 合格 |
| 16 | Production Build と正式配信を合格させる | Build、Delivery Log、Health | 合格。SYSTEM Delivery `21:06:44` 成功、正式 Health 0.18.18 |
| 17 | Build と配信 Asset Hash を一致させる | SHA256 | 合格。HTML、JS、CSS の三層 Hash 一致 |
| 18 | Browser Console Error と Warning を 0 にする | Console 証拠 | 合格。Error 0、Warning 0 |
| 19 | 生成中、Stop 中、停止後、自然完了の Screenshot を保存する | 公開可能な画像 | 合格。四件と SHA256 を保存 |
| 20 | 個人名とメールを Screenshot に含めない | AIアシスタント Region Screenshot | 合格。固定 Header を裁切し、四件を目視確認 |
| 21 | `v0.18.18^{}` が 0.18.18 の最終 Application Commitを指す | Git Remote Evidence | 合格。Local と Remote の `v0.18.18^{}` は `7231f36a30b3e3349c8f7238ca40f12fe111fd6c`。現在の `master` と `v0.18.19` の祖先であることを確認 |
| 22 | 既存履歴を削除せず、無関係変更を Commitしない | Git Diff、Browser 履歴 | 合格。既存二 Session を保持し、限定 Stage 対象を文書と四 Screenshot に限定 |
| 23 | Reload 後も Cancelled 状態を復元し、古い Loader を表示しない | Browser Reload、永続化契約 | 合格。停止文言 1、Streaming Loader 0、User Turn 4 |
| 24 | Browser が直接注入できない操作を明記する | Browser 能力、Portal Test | 合格。Drag and Drop の直接 File Data 注入制約と代替証拠を記録 |
| 25 | Task専用Worktree、依存Junction及び一時成果物を整理する | File System、Task Log、Learning Receipt | 合格。Task Worktree登録と残存Directoryを削除し、他のWorktreeとRuntime成果物を保持 |
| 26 | 全項目を第1項から再実行し、合格後だけ完了報告する | 本一覧、最終受領記録、Remote Evidence | 合格。機能、試験、配信、Browser、Console、Screenshot、Tag、限定Stage及び整理を全順序で再確認 |
