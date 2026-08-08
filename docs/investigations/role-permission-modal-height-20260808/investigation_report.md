# ロール権限編集ダイアログ高さ調査報告

## 目的

ロール権限編集ダイアログがブラウザー表示領域を超えて下部の保存操作を隠す問題を調査し、ダイアログ内の権限マトリクスだけを縦スクロールできる状態へ修正する。

## 調査結果

1. `IdentityManagementPage.tsx` の権限マトリクスは横幅 `scroll.x` だけを設定しており、行数に応じた `scroll.y` がなかった。
2. 前回の CSS は Ant Design 6 の実 DOM に存在しない `.ant-modal-content` を対象にしていた。実際の外枠は `.ant-modal`、内部の枠は `.ant-modal-container` である。
3. Table 自身のスクロールは追加されたが、外枠の高さが固定されていなかったため、本文が Modal の外側へ伸びて保存操作が隠れた。

## 実装

1. `PERMISSION_MATRIX_SCROLL_Y` を `max(96px, calc(100vh - 640px))` として定義し、既存の横スクロール値と同じ `Table.scroll` に `y` を追加した。
2. Modal に `centered` を設定し、`.role-permission-modal` と実 DOM の `.ant-modal-container` に `height: calc(100vh - 48px)` を設定した。
3. Modal の header と footer を固定し、`.ant-modal-body > .ant-form` だけを `overflow-y: auto` の本文スクロール領域にした。
4. 権限表の内部スクロールを維持し、既存の横方向スクロール、機能ノード列と操作列の固定幅は変更していない。
5. 日本語要件文書へモーダル外枠固定、本文スクロール、横スクロール維持の要件を追加した。

## 制約

IAB で公開 HTTPS ページのログイン画面までは確認できた。Windows SSO ボタン押下後の `ohr0067:8998` への遷移は Browser Use の URL 安全ポリシーでブロックされ、Edge の既存タブも `ERR_BLOCKED_BY_CLIENT` だった。認証済みロール管理画面へ到達できなかったため、実ブラウザーでの Modal 寸法、権限表の実スクロールバー、表示領域別のスクリーンショットは `evidence_missing` とする。認証を迂回する操作は行っていない。

## 結論

ソース、単体テスト、ビルド、公開資産、Gateway、Nginx、HTTPS の検証は完了した。実 DOM の `.ant-modal-container` を対象に修正し、再公開後の静的資産契約も確認した。認証済みブラウザーによる Modal 最終表示確認だけが残っている。
