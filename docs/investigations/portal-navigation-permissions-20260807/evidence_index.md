# 証拠索引

| 証拠 | 内容 | 結果 |
| --- | --- | --- |
| E-01 | `app/apps/portal-shell/src/App.tsx` の旧入口判定 | 個別権限のない項目が `dashboard.read` に到達することを確認 |
| E-02 | `app/db/migrations/009_create_identity_and_rbac.sql` と現行 DB の権限一覧 | 四つの独立 Permission Code が未登録であることを確認 |
| E-03 | `app/gateway/auth.mjs` の製品構築判定 | `/builder/` が `dashboard.read` を要求していたことを確認 |
| E-04 | `app/gateway/identity-database.mjs` のロール権限 API | `permissions` テーブルの内容をマトリクスへ返す契約を確認 |
| E-05 | `036_add_portal_navigation_permissions.sql` | 四つの権限定義と標準三ロールの初期割当を確認 |
| E-06 | Portal Shell と Gateway の単体試験 | 新しい入口対応、マトリクス行、Builder 境界を確認 |
| E-07 | 本番ビルドと正式 HTTPS Portal の Browser 確認 | HTTPS ページは Windows ドメイン認証待ちでロール画面へ到達できず、`evidence_missing`。Console warning/error は 0 件 |
| E-08 | ローカル Browser フィクスチャ `http://127.0.0.1:5187/system-management/roles` | 左側ナビゲーションと権限マトリクスに四つの新規ノードが表示され、横方向の溢出なし、Console warning/error 0 件。`docs/evidence/portal-navigation-permissions-20260807-fixture.png` |
| E-09 | 正式配信 Health と実 DB 照会 | HTTP 200、`status=UP`、Backend `0.15.0`。四つの Permission Code は各三標準ロールに関連付け済み |
