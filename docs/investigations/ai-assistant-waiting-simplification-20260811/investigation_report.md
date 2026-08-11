# AI 応答待機表示簡素化調査

## 要求

AI 応答待機表示を、小さな Animation 一つで処理中と分かる構成へ簡素化する。OneOps の既存美術 Style は維持する。

## 実装結果

- 活動 Panel、枠線、Orbit、五分割 Meter、経過秒数を削除した。
- 幅 20px の三点 Animation と既存状態文言だけを残した。
- Reduced Motion では位置移動を停止し、1.8 秒周期の明暗切替を継続する。
- Streaming 本文の `TextLoader` と既存 SSE 状態契約は維持した。

## 正式 Browser 結果

- Version: `0.18.15`
- Reduced Motion: `true`
- Frame 1 Opacity: `[1, 0.22, 1]`
- Frame 2 Opacity: `[0.22, 0.22, 0.22]`
- Dot: 3
- Orbit、Meter、秒数、Panel: 0
- Console Error: 0
- Console Warning: 0
- Screenshot: `evidence_missing`

## Screenshot 制約

Application 内 Browser の `Page.captureScreenshot` が長い会話、空の新規会話、新しい Home Tab の三条件で Timeout した。Chrome 接続は利用できず、Windows 画面制御は Codex Desktop 自動化禁止規則に該当するため使用しなかった。
