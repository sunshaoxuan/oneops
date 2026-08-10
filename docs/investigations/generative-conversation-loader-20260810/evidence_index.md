# 証拠索引

| 主張 | 証拠 | 確度 | 制限 |
| --- | --- | --- | --- |
| 公開ライブラリは React 18 以上と Node 20 以上を要求する | 公式 Docs の Quick start、npm registry の `engines` と `peerDependencies` | 高 | npm 配布版 0.1.1 時点 |
| ストリーミング入力は受信済み全文である | 公式 Docs の Streaming text、配布物 README、`TextLoader` 実装 | 高 | 外部パッケージ内部仕様は将来変更され得る |
| OneOps は delta を累積して全文を保持する | `app/apps/portal-shell/src/AiAssistantChat.tsx` の `eventReply` | 高 | CAG が送信する event 順序に依存する |
| 待機段階は QUEUED と RUNNING を区別できる | `eventReply` と AI 助手表示分岐 | 高 | 外部側の追加状態は現行対象外 |
| 公開サイトと npm 配布型の variant 数に差がある | 公式 Docs 画面、`node_modules/generative-loaders/dist/types.d.ts` | 高 | サイト更新と配布版の時点差を含む |
| reduced motion と live status が提供される | 公式 Accessibility 記載、配布 JS と CSS | 高 | 実ブラウザ確認は配信後に実施する |
