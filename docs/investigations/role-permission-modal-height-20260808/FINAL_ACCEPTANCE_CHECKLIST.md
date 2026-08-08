# 最終受入チェックリスト

| 項目 | 成果物 | 証拠 | 状態 |
| --- | --- | --- | --- |
| ダイアログ全体が表示領域を超えない高さ制約を持つ | `.role-permission-modal` と `.ant-modal-content` の `max-height` | `styles.css`、Portal test | 合格 |
| 権限マトリクスが内部縦スクロールを持つ | `PERMISSION_MATRIX_SCROLL_Y` と `scroll.y` | `IdentityManagementPage.tsx`、Portal test、公開 JS | 合格 |
| タイトル、基本情報、保存操作を残す構造を維持する | Modal body の外溢れ制約、Table 内部 scroll | `styles.css` | 合格 |
| 既存の横スクロールを維持する | `scroll.x` と固定列幅 | `IdentityManagementPage.tsx`、既存 matrix test | 合格 |
| 要件文書を更新する | `IDENTITY_MANAGEMENT_UI_REQUIREMENTS.md` | Git diff | 合格 |
| 単体テストと本番ビルドを通過する | Portal、Gateway、Worker、Backend artifact | `test_results.md` | 合格 |
| 変更を実行環境へ公開する | `html` asset、Gateway、Nginx、HTTPS | `test_results.md`、delivery log | 合格 |
| 認証済みブラウザーで実測しスクリーンショットを保存する | ロール管理画面の実測証拠 | Browser Use | 未完了、`evidence_missing`。SSO 遷移が URL ポリシーと Edge によりブロック |

## 判定

コードと公開は完了した。最終受入のブラウザー実測項目は認証セッション不足で未完了のため、Modal 表示についての最終完了報告は保留する。
