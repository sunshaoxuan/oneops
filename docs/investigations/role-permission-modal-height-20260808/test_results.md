# テスト結果

## 自動テスト

| 対象 | 結果 |
| --- | --- |
| Portal Shell Vitest | 20 ファイル、168 テスト成功 |
| Gateway Node test | 215 テスト成功 |
| Builder worker unittest | 14 テスト成功 |
| Backend Maven rolling package | 34 テスト実行、8 件は環境依存で skip、失敗 0 |
| TypeScript と Vite 本番ビルド | 成功 |
| `git diff --check` | 成功。Git の改行変換 warning のみ |

## 実行環境

| 確認項目 | 結果 |
| --- | --- |
| Gateway health | `status=UP`、Spring backend `0.16.0` |
| HTTPS | `https_status=200`、`text/html` |
| index の参照資産 | JS と CSS は存在確認済み |
| 公開後の静的契約 | `100vh - 560px`、`100vh - 32px`、`role-permission-modal` を公開 asset 内で確認 |

## ブラウザー

| 確認項目 | 結果 |
| --- | --- |
| 公開ログイン画面 | IAB で表示確認、Windows SSO ボタンあり |
| Console | IAB はログイン DOM 取得まで成功したが、SSO 遷移後の URL ポリシー阻止で継続取得できず、認証済み画面の Console は `evidence_missing`。Edge 既存タブには拡張機能 context invalidated があり、OneOps UI 由来とは判定していない |
| 認証済みロール画面 | `evidence_missing`。SSO 遷移が URL ポリシーと Edge によりブロック |
| Modal 寸法、内部縦スクロール、スクリーンショット | `evidence_missing` |
