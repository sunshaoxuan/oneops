# ホーム画面権限表示境界の調査回付

Gateway のスナップショットフィルター、SSE の接続別応答、Portal の機能別表示分岐及び単体テストを追加し、`pnpm check` と rolling publish を完了した。Gateway health は `UP`、HTTPS は 200 を確認した。

認証ページの SSO 入口と Console は Browser で確認した。認証済み Browser セッションがなく、代理ログインによる権限変更後のホーム画面、Network、SSE、Console、スクリーンショットは `evidence_missing` として残る。`FINAL_ACCEPTANCE_CHECKLIST.md` の保留項目を埋めるまで初回受入を完了扱いにしない。
