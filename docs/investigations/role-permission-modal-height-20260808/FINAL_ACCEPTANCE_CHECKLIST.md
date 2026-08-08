# 最終受入チェックリスト

| 項目 | 成果物 | 証拠 | 状態 |
| --- | --- | --- | --- |
| ダイアログ外枠が中央固定され表示領域を超えない | `.role-permission-modal` と `.ant-modal-container` の固定 height/max-height | `styles.css`、Portal test、公開 CSS | 合格、実ブラウザー実測待ち |
| 権限マトリクスが内部縦スクロールを持つ | `PERMISSION_MATRIX_SCROLL_Y` と `scroll.y` | `IdentityManagementPage.tsx`、Portal test、公開 JS | 合格 |
| タイトル、基本情報、保存操作を残す構造を維持する | Modal header/footer 固定、Form 本文 `overflow-y:auto` | `styles.css`、公開 CSS | 合格、実ブラウザー実測待ち |
| 既存の横スクロールを維持する | `scroll.x` と固定列幅 | `IdentityManagementPage.tsx`、既存 matrix test | 合格 |
| 要件文書を更新する | `IDENTITY_MANAGEMENT_UI_REQUIREMENTS.md` | Git diff | 合格 |
| 単体テストと本番ビルドを通過する | Portal、Gateway、Worker、Backend artifact | `test_results.md` | 合格 |
| 変更を実行環境へ公開する | `html` asset、Gateway、Nginx、HTTPS | `test_results.md`、delivery log | 合格 |
| 認証済みブラウザーで実測しスクリーンショットを保存する | ロール管理画面の実測証拠 | Browser Use、ユーザー提供画像 | 再検証中 |

## 判定

前回公開版はユーザー提供画像で外枠固定不足が確認された。実 DOM の `.ant-modal-container` を対象に修正し、全量テスト、再公開、health、HTTPS、公開 asset 契約を再確認した。認証済みブラウザーでの実測と修正後スクリーンショットはユーザー側の認証セッションで確認する項目として残る。
