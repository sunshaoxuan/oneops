# 証拠索引

| 主張 | 証拠 | 信頼度 | 制限 |
|---|---|---|---|
| 編集対象はロール物理 ID である | IdentityManagementPage.tsx の updateRole(editing.id, values)、Spring の saveRole(String id, ...)、PUT /roles/{id} | 高 | なし |
| Code、Name、説明を編集できる | 同ファイルの編集フォーム、auth-ui.test.ts の無効化否定検証 | 高 | 画面での保存操作は既存データを壊さないよう入力変更を伴わず、編集可否を実測 |
| Code 変更後も物理 ID が維持される | RoleCrudDatabaseTest.java の作成、更新、ID 一致、権限数確認 | 高 | DB 統合試験は環境変数で有効化した場合に実行 |
| 強参照は role_id 外部キーである | 009_create_identity_and_rbac.sql の role_permissions.role_id、user_role_assignments.role_id、IdentityService.java の role ID 更新および割当処理 | 高 | 既存データベースの全行ダンプは取得していない |
| Gateway も同じ物理 ID 更新契約を持つ | identity-database.mjs の WHERE id = $1 更新と role_permissions.role_id 操作 | 高 | Gateway 統合 DB は本回の標準テスト環境で実行 |
| 本番配信が成功した | continuous-delivery.log の 2026-08-07 11:51:50 delivery_started と 11:52:23 delivery_succeeded、理由 role-edit-physical-id-20260807 | 高 | 配信は既存の常駐環境へ実施 |
| 実ブラウザーで編集項目と権限マトリクスを確認した | docs/evidence/role-edit-physical-id-20260807.png、正式 URL のロール編集ドロワー、Console warning/error 0 件 | 高 | Code の保存後再読込は既存データ保護のため実施していない |
| 既定ロール付与の保存値は物理 ID である | identity-database.mjs と IdentityService.java の SELECT role.id から user_role_assignments.role_id への INSERT | 高 | 選択入口の検索条件は既定ロール Code のまま。標準ロールの固定 UUID は今回追加していない |
