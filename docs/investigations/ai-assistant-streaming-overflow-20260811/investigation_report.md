# AIアシスタント Streaming 横幅調査

## 目的

回答生成中に会話領域が横方向へ拡張され、Page Layout が変形して横 Scrollbar が表示される問題を解消する。

## 根因

1. `.ai-assistant-conversation` は `overflow-y: auto` だけを指定していた。CSS の計算結果では `overflow-x` も `auto` となり、子要素の一時的な超幅を横 Scrollbar として表示した。
2. `.ai-assistant-messages`、`.ai-assistant-turn`、`.ai-assistant-message` に Grid と Flex Item の縮小に必要な `min-width: 0` と `max-width: 100%` が揃っていなかった。
3. Streaming 専用 `TextLoader` の Adapter に Loader、Visual、Copy の幅上限と長文折返しがなかった。
4. 完了後の `AiMarkdown` は `min-width: 0` と `overflow-wrap: anywhere` を持ち、正式 Browser でも `scrollWidth` と `clientWidth` が一致した。

## 修正

1. 会話領域を縦 Scroll 専用とし、`overflow-x: hidden` を追加した。
2. Message Grid、Turn、Message へ縮小境界を追加した。
3. Streaming Loader を幅 100 パーセント以内へ制限し、Copy へ `overflow-wrap: anywhere` と `word-break: break-word` を追加した。
4. User Message にも同じ長文折返し境界を追加した。

## 境界

CAG、SSE、回答本文、保存データ、Model Routing、Markdown 表示及び縦 Scroll は変更しない。

## 検証状態

Source Test と Production Build は合格した。正式配信後に長文 Streaming の開始、本文受信中及び完了後の幅、Console、Screenshot を確認する。
