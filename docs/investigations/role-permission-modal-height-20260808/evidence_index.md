# 証拠一覧

| 主張 | 証拠 | 信頼度 | 制限 |
| --- | --- | --- | --- |
| 権限表は視口に応じた内部縦スクロール値を持つ | `app/apps/portal-shell/src/IdentityManagementPage.tsx` の `PERMISSION_MATRIX_SCROLL_Y` と `scroll.y` | 高 | 実ブラウザーの計算済み高さは未確認 |
| Modal 本体と実 DOM container は表示領域内に制限される | `app/apps/portal-shell/src/styles.css` の `.role-permission-modal`、`.ant-modal-container` | 高 | 認証済み画面の実測は未確認 |
| UI 回帰テストが高さとスクロール契約を検査する | `app/apps/portal-shell/src/auth-ui.test.ts` | 高 | 静的契約テストでありブラウザー描画ではない |
| 要件文書が更新されている | `docs/IDENTITY_MANAGEMENT_UI_REQUIREMENTS.md` | 高 | 既存文書の一部は過去の中国語記述を保持 |
| Portal テストは成功した | `pnpm --filter @one-ops/portal-shell test`、20 ファイル、168 テスト | 高 | なし |
| 全量チェックと本番ビルドは成功した | `pnpm check`、Gateway 215、Worker 14、Portal 168、本番 build | 高 | 既存の chunk size warning は残る |
| 公開資産に変更が反映された | `D:\nginx\html\index.html`、`index-CfJ4m8Ht.css`、`index-bDF704-5.js`、資産存在確認 | 高 | 表示は未認証 |
| 実行環境は稼働している | `GET http://127.0.0.1:8092/api/work-center/v1/health` が `UP`、HTTPS が 200 | 高 | 画面認証は未完了 |
| 認証済み Modal の寸法とスクリーンショット | ユーザー提供画像は Table 内部スクロールを確認し、外枠固定不足を示す | 中 | 修正後の認証済み実測は再確認予定 |
