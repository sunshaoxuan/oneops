# AIアシスタント長時間待機案内 調査報告

## 目的

回答本文の到着前でも経過時間を確認でき、長時間待機時に待機継続又は停止後の再送信を判断できる画面へ変更する。

## 障害 Task の事実

最新 Task `575ba1f6-1152-433f-a574-dbb1e58d3b3d` は作成後直ちに Running へ遷移し、39 秒後に `AI_ASSISTANT_GATEWAY_RESTARTED` で Failed となった。出力文字数は 0、Event は `task.created`、`task.started`、`task.failed` の三件だった。

直近の正常 Task は 4 秒から 22 秒で完了していた。この実績を基に、30 秒を長時間待機案内の閾値とした。

## 実装契約

1. `task.created_at` から経過秒数を算出する。
2. 回答本文の到着前から毎秒表示を更新する。
3. 30 秒未満は三点 Animation、状態文言、秒数の一行表示とする。
4. 30 秒以上は待機継続又は既存 Stop 後の再送信案内を二行目に表示する。
5. 自動再試行は追加しない。同一入力の重複 Task を避ける。
6. Failed、Cancelled、Completed の終端では Loader 自体を終了する既存契約を維持する。
