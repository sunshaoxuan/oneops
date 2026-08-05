# テスト結果

## 自動試験

| 対象 | 結果 |
|---|---|
| Portal 専用試験 | 17 ファイル、144 件合格 |
| 全体試験 | Gateway 175 件合格、Portal 144 件合格、Builder Python 14 件合格 |
| Portal production build | Vite build 合格。既存の chunk size warning のみ |
| 静的公開 | `delivery_succeeded`、Nginx 設定テスト成功 |

## 実ページ試験

| 対象 | 寸法又は状態 | 結果 |
|---|---|---|
| 顧客情報 | `SolutionOutlined`、62×62px | 合格 |
| 個人タスク | `CheckSquareOutlined`、62×62px | 合格 |
| 管理区画 7 区画 | 48×48px | 合格 |
| デスクトップ全体 | `body.clientWidth` と `body.scrollWidth` が一致 | 合格 |
| 640px 顧客情報 | viewport 640px、body 625px、body の横幅一致 | 合格 |
| 640px Agent Gateway | viewport 640px、body 625px、48×48px | 合格 |
| ブラウザーコンソール | 対象画面で warning と error なし | 合格 |

## ページレベルアイコンの上下中央追補

| 対象 | 確認結果 |
|---|---|
| 顧客情報デスクトップ | Hero 内の本文中心 y=251.5px、アイコン中心 y=251.5px | 合格 |
| 個人タスクデスクトップ | Hero 内の本文中心 y=178px、アイコン中心 y=178px | 合格 |
| 顧客情報 640px | アイコンは本文の上端へ移動し、body の clientWidth と scrollWidth が一致 | 合格 |
| アイコン専用レイアウト試験 | 25 件合格 | 合格 |

## 回復記録

640px でサイドバーが収縮し、デスクトップ用の文字付き locator が一致しなかった。狭い画面の DOM から可視メニューを再取得して操作を継続した。Agent Gateway の直接遷移は待機がタイムアウトしたが、URL が目的ページへ切り替わっていることを確認し、追加待機後に DOM、寸法、コンソール及びスクリーンショットを取得した。
