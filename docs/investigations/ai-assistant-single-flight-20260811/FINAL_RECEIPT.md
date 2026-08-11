# 最終回执

## 対象

同じ AIアシスタント Conversation の回答生成中に 2 件目の発言を作成できる問題を解消する。

## 予定成果

1. Portal の全送信入口を共通 Conversation Lock へ統一する。
2. Gateway の原子的な Conversation Lock と HTTP 409 契約を追加する。
3. 進行中 Task と SSE を継続し、終端後に Composer を復元する。
4. Session 切替時の非同期 Cache と入力状態を送信元へ限定する。

## 現在の判定

実装、試験、正式配信、Browser、Console、Screenshot、Git 及び Tag の最終証拠を収集中である。全受入項目が合格した後に本回执を確定する。
