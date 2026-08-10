# 試験結果

## 現在の結果

| 試験 | 結果 | 証拠 |
| --- | --- | --- |
| 新規コンポーネント初回試験 | 失敗 | jest-dom matcher の初期化不足を検出 |
| 修正後の focused test | 合格 | 2 files、23 tests |
| Portal 全試験 | 合格 | 29 files、195 tests |
| OneOps 全 check | 合格 | Gateway 228、Worker 14、Portal 195、production build |
| production build | 合格 | 3850 modules、`index-BDIoOB-6.js`、`index-2ALUKCbD.css` |
| Nginx 設定 | 合格 | `nginx -t` successful |
| 静的配信 | 合格 | `delivery_succeeded`、配信元と Web root の index SHA256 一致 |
| Health | 合格 | `UP`、Backend `0.17.1` |
| HTTPS | 合格 | HTTP 200 |
| 実ブラウザ画面 | 証拠不足 | Windows SSO が in-app Browser と Edge の双方で停止 |
| Console | 証拠不足 | AI 助手画面へ到達できないため対象ページ Console を取得できない |
| スクリーンショット | 証拠不足 | Edge の対象画面未到達、阻断画面の capture も timeout |
| production audit | 既存リスク検出 | `exceljs` と `jsdom` 系統に 5 high、5 moderate。新規 `generative-loaders` 系統は列挙対象外 |

## ブラウザ受入の制限

配信物と実行環境は確認済みである。AI 助手の待機、ストリーミング、完了切替の表示、対象ページ Console、スクリーンショットは認証経路の制限により `evidence_missing` とする。
