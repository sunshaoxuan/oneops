# 最終受入一覧

最終受入は当初目的から逐項実行する。一項でも不合格の場合は修正後に第 1 項から再実行する。

| No. | 当初目的又は制約 | 成果物 | 状態 |
| --- | --- | --- | --- |
| 1 | 生成中も次回 Draft を入力、編集、削除できる | Portal Composer、Browser DOM | Source と Portal Test 合格、Browser 待検証 |
| 2 | 通常文字 Paste と Shift + Enter を利用できる | Portal Handler、Browser 操作 | Source と Portal Test 合格、Browser 待検証 |
| 3 | Enter、Click、直接 API で二件目を作成しない | Submission Ref、Gateway DB Lock、Task 件数 | Portal と Gateway Test 合格、Browser と実 Task 件数待検証 |
| 4 | 生成中は Send 位置へ実心四角 Stop を表示する | Portal、CSS、ARIA、Screenshot | Source と Portal Test 合格、Browser 待検証 |
| 5 | Stop は選択時の最新 Task だけを対象にする | Gateway Lock、Ownership Test | 合格 |
| 6 | Stop の二重 Click を一件に限定する | Task ID Set と同期 Ref、Portal Test | 合格 |
| 7 | Stop HTTP 202 後も SSE と送信 Lock を維持する | Portal State、Network、SSE | 複合状態と背景 SSE Test 合格、Browser 待検証 |
| 8 | CAG が実際の Runtime を停止して task.cancelled を一件生成する | CAG Runtime Task | 合格 |
| 9 | 部分回答と Draft を保持し、失敗と停止を分離する | Reply Reducer、Browser DOM | Reducer と詳細照合 Test 合格、Browser 待検証 |
| 10 | Stop 失敗時は SSE 継続、Draft 保持、再試行可能 | Portal Error State、Test | Session、Task、試行 ID の Error State Test 合格、Browser 待検証 |
| 11 | Session 間で Draft、Task、Reply、Stop を混在させない | Session State、Browser 二 Session | 複合 Key、背景 SSE、Cache 更新 Test 合格、Browser 待検証 |
| 12 | 自然完了経路と終端後 Send 復元を維持する | Portal Test、Browser | Portal Test 合格、Browser 待検証 |
| 13 | CAG 0.28.4 の API、文書、Version、Runtime を揃える | CAG Commit、Tag、Health | 合格 |
| 14 | OneOps 0.18.18 の要件、Changelog、Version を揃える | 正式文書と Version File | 合格 |
| 15 | Portal、Gateway、Worker、Backend、Operations Test を合格させる | 全試験結果 | 合格 |
| 16 | Production Build と正式配信を合格させる | Build、Delivery Log、Health | 返工後 Build 合格、返工後配信待検証 |
| 17 | Build と配信 Asset Hash を一致させる | SHA256 | 最初の配信合格、返工後 Asset 待検証 |
| 18 | Browser Console Error と Warning を 0 にする | Console 証拠 | 待検証 |
| 19 | 生成中、Stop 中、停止後、自然完了の Screenshot を保存する | 公開可能な画像 | 待検証 |
| 20 | 個人名とメールを Screenshot に含めない | Element Screenshot | 待検証 |
| 21 | `HEAD == origin/master == v0.18.18^{}` を確認する | Git Remote Evidence | 待検証 |
| 22 | 既存履歴を削除せず、無関係変更を Commitしない | Git Diff、Browser 履歴 | 待検証 |
| 23 | 全項目合格後だけ完了報告する | 本一覧と最終受領記録 | 待検証 |
