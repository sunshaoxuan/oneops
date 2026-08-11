# AIアシスタント会話インタラクション調査報告

## 調査目的

Beautiful UI の暗色 Theme を除く操作構造と画面効果を調査し、OneOps の既存美術スタイルを維持した改善範囲を確定する。

## 参考画面の確認結果

明色表示で Loading State、Thinking、Streaming Text、Tool Chips、Task Rows、Chat、Prompt Bar を操作した。

| 対象 | 確認した動作 | OneOps への判断 |
| --- | --- | --- |
| Loading State | 状態名と経過時間を同じ位置へ表示 | Task の実時刻を使用して採用 |
| Thinking | 要約を Button で展開し、段階を縦方向へ表示 | 既存 SSE 状態だけを表示する条件で採用 |
| Streaming Text | 回答本文の近くへ操作を配置 | 完了回答のコピーとして採用 |
| Tool Chips | Tool 実行を折り畳み表示 | Backend 契約がないため対象外 |
| Chat | 会話と Composer を一つの操作面へ配置 | 既存構造を維持し、最新位置への復帰を追加 |
| Prompt Bar | Focus、送信、改行を入力位置で理解できる | 既存 Composer へ操作説明を追加 |
| Sources、Follow-ups | 根拠と追加質問を回答へ付随 | 対応データ契約がないため対象外 |

## 既存実装との差分

既存実装は待機と Streaming Animation、会話内クイックナビゲーション、添付、三言語表示を提供している。処理段階の展開、回答単位の操作、Streaming 中の追従制御、Composer の Keyboard 説明が未実装だった。

## 実装方針

1. 既存 `AiAssistantChat` の SSE 状態機械を変更しない。
2. `created_at`、`completed_at` と既存状態だけを表示 Adapter へ渡す。
3. 既存 CSS 色と Ant Design Component を使用する。
4. Browser で参考画面と OneOps 実画面を別々に検証する。

## 制約

参考画面の Source code は実装根拠に使用していない。可視 UI の操作結果だけを対象とした。
