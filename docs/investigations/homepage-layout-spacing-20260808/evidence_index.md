# 証拠索引

| 主張 | 証拠 | 信頼度 | 制限 |
| --- | --- | --- | --- |
| Hero の直後に個人タスク概要が描画される | `app/apps/portal-shell/src/App.tsx:1211-1274` | 高 | ソース構造の確認 |
| 接近の原因は専用上辺余白 `0` である | 変更前後の `app/apps/portal-shell/src/styles.css`、`workbench-spacing.test.ts` | 高 | 実画面の認証後計測は未取得 |
| 変更後の間隔は `18px` である | `app/apps/portal-shell/src/styles.css:2719-2721`、Portal テスト 171 件 | 高 | ブラウザの computed style は未取得 |
| Portal の静的テストとビルドが成功した | `docs/investigations/homepage-layout-spacing-20260808/test_results.md` | 高 | 実行環境の画面確認を代替しない |
| 公開スクリプトが成功した | 公開ログの `delivery_succeeded`、Gateway health `UP`、HTTPS 200 | 中 | Browser からの画面確認は未取得 |
| 公開中の CSS に `margin-top:18px` が含まれる | `GET https://192.168.20.54/` で取得した `/assets/index-cx8Vq2Yu.css` の該当規則 | 高 | 静的配信内容の確認であり、認証後の描画計測ではない |
| Browser Console にエラーがないこと | 認証待ち画面のログ取得結果 | 低 | Workbench まで到達していないため、ホーム画面の Console 検証は `evidence_missing` |
