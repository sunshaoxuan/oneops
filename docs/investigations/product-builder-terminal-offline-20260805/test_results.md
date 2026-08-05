# 試験結果

## 自動試験

- Gateway、規約試験: 159 件成功
- builder worker: 14 件成功
- Portal: 16 ファイル、130 件成功
- Portal production build: 成功
- Python compile: 成功

## 最終受入

| 項目 | 結果 | 証拠 |
|---|---|---|
| 固定ポート維持 | 合格 | `8092` と `8093` が Listen、`8091` は Listen なし |
| 停止操作 | 合格 | `status=requested`、`ok=true` |
| 停止中のページ | 合格 | HTTP 200、構築器本文を確認 |
| 停止中の端末状態 | 合格 | HTTP 200、`status=stopped` |
| 停止中の OneOps 健康 | 合格 | `8092` と `8093` が `UP` |
| 停止中の HTTPS | 合格 | HTTP 200 |
| 停止中の関連 502 | 合格 | 観測区間 0 件 |
| 起動操作 | 合格 | `status=requested`、`ok=true` |
| 起動後の端末状態 | 合格 | `status=running`、CPU、Memory、Disk を取得 |

## ブラウザ確認

OneOps HTTPS ログイン画面は表示され、Console Error と Warning は 0 件だった。今回の変更は UI を変更していない。検証時の in-app Browser に認証済みセッションが存在しなかったため、認証済み製品構築画面のスクリーンショットは取得していない。停止中の製品構築本文は同じ worker 実行経路で HTTP 200 と本文を確認した。
