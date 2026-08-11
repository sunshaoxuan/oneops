# AIアシスタント会話目盛り Preview 調査

## 目的

会話クイックナビゲーションの各目盛りへ Pointer を置いた時に、対応する利用者の発言と AI 回答の節選を明確に表示する。

## 正式画面の再現結果

1. 0.18.18 の正式画面では四つの会話 Turn に対して四つの目盛りが生成され、Task と目盛りの対応は一対一だった。
2. Hover 後の Tooltip DOM には利用者の発言と AI 回答が含まれていた。
3. Tooltip Root は `position: fixed` のまま初期退避座標 `x = -12800`、`y = -7200` に残り、画面内へ整列されなかった。
4. 利用者には目盛りだけが見え、Preview 内容は表示されなかった。

## 修正

1. 会話目盛りから Portal Tooltip を削除した。
2. 各目盛りを一つの会話 Turn と対応させたまま、同じ目盛り要素の隣へ会話領域内 Preview Card を表示する。
3. Preview Card を「ユーザーの発言」と「AI の回答」の明示 Label で分割した。
4. 日本語、中国語及び英語の Label を追加した。
5. 上端二件と下端二件では Preview Card の縦位置を端へ揃え、会話領域から欠落しないようにした。
6. Click による対応利用者発言への移動、Keyboard Focus、Reduced Motion の既存契約を維持した。

## 変更境界

会話 API、Task 保存、CAG、SSE、回答本文及び会話 Scroll の契約は変更しない。

## OpenAI 公式資料の調査

OpenAI 公式 Documentation から会話目盛り Hover の具体的な UI 契約は確認できなかった。実装判断は利用者が提示した ChatGPT 方式の要求、添付 Screenshot、OneOps 正式 DOM 及び既存要件を根拠とする。

## 最終検証

1. 正式 0.18.19 で四つの目盛りと四つの会話 Turn が一致した。
2. 全目盛りで「ユーザーの発言」と「AI の回答」の Label 及び対応内容を確認した。
3. 全 Preview Card が 1280 x 720 Viewport 内へ収まった。
4. Hover 前、全目盛り Hover 中、Click 後及び Focus 中の Page Root は `1280 / 1280 / 720 / 720` を維持した。
5. Click 後に会話 Scroll Top は 306 から 18 へ移動し、対象発言 Top は 181 となった。
6. Focus 中も Preview と `aria-describedby` を維持した。
7. Console Error と Warning は零だった。
8. Build と正式配信の `index.html`、JS、CSS の SHA-256 は一致した。
