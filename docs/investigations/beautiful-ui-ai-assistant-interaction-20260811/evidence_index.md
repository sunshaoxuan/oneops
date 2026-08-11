# 証拠索引

| 主張 | 証拠 | 確度 | 制約 |
| --- | --- | --- | --- |
| 参考画面は処理状態を折り畳める | Browser の `Thought for 4 seconds` における `aria-expanded` 変化 | 高 | 可視 UI の確認 |
| Prompt Bar は Command 選択後に候補を閉じる | Browser で `/compare` を選択後、Command 候補が非表示 | 高 | Demo 内動作 |
| Tool call は要約から折り畳める | Browser の `4 tool calls, 2 messages` における `aria-expanded` 変化 | 高 | OneOps に Tool 契約なし |
| OneOps は SSE の段階状態を保持する | `app/apps/portal-shell/src/AiAssistantChat.tsx` | 高 | 現行 Source |
| OneOps は Task の開始と完了時刻を保持する | `app/packages/api-client/src/index.ts` | 高 | 秒単位表示へ使用 |
| 処理状況を展開できる | `final-process-copy-0.18.12.png`、`aria-expanded=true` | 高 | 正式 HTTPS 画面 |
| 回答コピーが成功する | `final-process-copy-0.18.12.png`、`コピーしました` 1 件 | 高 | Browser Clipboard |
| 過去閲覧時だけ最新会話操作を表示する | `final-latest-action-0.18.12.png`、復帰後 0 件 | 高 | 9 Turn の実会話 |
| 600px で Keyboard 説明を隠す | `final-narrow-0.18.12.png`、`isVisible=false` | 高 | 600 x 900 Viewport |
| Reduced Motion を尊重する | Browser `prefers-reduced-motion=true`、該当 CSS | 高 | 正式 Browser 設定 |
| Console Error がない | 新規正式画面 Tab の error 0 件 | 高 | Browser Dev Log |
| 配信が正式成果物と一致する | Dist と Web Root の SHA256 `468ee41273cbb5de4fb1c9a6bfdd8c4bd891f84edf78802aa735dbf4f14f166c` | 高 | `index.html` |
