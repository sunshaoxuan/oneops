# テスト結果

## 自動試験

| 対象 | 結果 |
|---|---|
| Portal レイアウト試験 | 28 件合格 |
| 全体試験 | Gateway 205 件合格、Portal 155 件合格、Builder Python 14 件合格 |
| Portal production build | Vite build 合格。既存の chunk size warning のみ |
| 静的公開 | `delivery_succeeded`、Nginx 設定テスト成功 |

## 実ページ試験

| 状態 | 確認結果 |
|---|---|
| 展開 | OneOps 文字、橙色 `rgb(255, 100, 40)`、副題、青緑色 `rgb(0, 166, 166)`、HR ロゴを確認 |
| 収縮 | OneOps 文字を確認、HR ロゴ非表示、副題非表示、ブランド幅 71px、`aria-expanded=false` |
| 横幅 | 展開と収縮の双方で `body.clientWidth` と `body.scrollWidth` が一致 |
| コンソール | 展開と収縮の双方で warning と error なし |
