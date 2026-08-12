# 最終受入一覧

| 原要求又は制約 | 成果物 | 証拠 | 判定 |
|---|---|---|---|
| SSO成功を速やかに反映する | 300ms Session確認 | Component試験 | 合格 |
| SSO失敗又は応答なしから復帰する | 5秒Timeout | Component試験及び正式Browser | 合格 |
| ユーザー名及びパスワードを使用できる | ローカルログインフォーム | 正式Browser及びScreenshot | 合格 |
| SSO手動再試行を維持する | Windows認証ボタン | 正式Browser及びScreenshot | 合格 |
| 正式環境へ配信する | Continuous Delivery | 配信成功ログ及び正式Asset | 合格 |
| Console及びScreenshot | 正式ログイン画面 | Console 0件及び証拠画像 | 合格 |
| 追加のSSO画面を表示しない | 同一Origin非表示Frame | Tab数不変及び可視Frame 0件 | 合格 |
| Nginx及び運用境界を維持する | 同一OriginSSO Proxy | 設定試験及び運用Script全量 | 合格 |
