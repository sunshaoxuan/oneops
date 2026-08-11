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

Source Test と Production Build は合格した。0.18.17 の継続配信は成功し、HTTPS Health、配信 Asset Hash、nginx 構成、8092 の単独待受を確認した。

正式 Browser では配信後の Root、会話領域、Message Grid が横幅内に収まり、会話領域の `overflow-x: hidden` も確認できた。長文 Streaming の実行時検証中に内蔵 Browser の制御対象が Timeout で失効した。再接続後は Windows SSO の認証代理への遷移時に制御対象が閉じるため、生成中と完了後の Screenshot 及び Console の最終証拠は `evidence_missing` とする。

この未確認項目を正式受入の阻害条件として維持し、`v0.18.17` Tag は作成しない。
