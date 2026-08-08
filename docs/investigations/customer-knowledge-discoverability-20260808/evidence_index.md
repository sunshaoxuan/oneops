# 証拠索引

| 主張 | 証拠 | 信頼度 | 制限 |
| --- | --- | --- | --- |
| CAG 入口はシステム管理の単一項目になった | `app/apps/portal-shell/src/App.tsx:2394-2400` | 高 | 認証後 Browser の実 DOM は別途確認 |
| 顧客情報ページから管理入口へ移動できる | `app/apps/portal-shell/src/CustomerInformationPage.tsx:1305-1326`、`app/apps/portal-shell/src/App.tsx:689-703` | 高 | 認証済みクリック計測が未完了 |
| 選択中の組織機関を CAG 管理画面へ渡す | `app/apps/portal-shell/src/App.tsx:1011-1021`、`CustomerKnowledgeSettingsPage.tsx:73-134` | 高 | Browser で選択値の実測が未完了 |
| 権限マトリクスの実入口表示が統一された | `app/apps/portal-shell/src/IdentityManagementPage.tsx:390-445` | 高 | ロール編集画面の認証後スクリーンショットが未完了 |
| 旧 scan/review 権限を表示及び保存対象から除外する | `app/apps/portal-shell/src/permission-matrix.ts:48-84`、`permission-matrix.test.ts` | 高 | DB に残る既存レコードそのものは変更しない |
| 顧客情報ページの操作境界を維持する | `app/apps/portal-shell/src/customer-information.test.ts:139-174` | 高 | 静的構造検査 |
| 公開版へ反映された | `delivery_succeeded`、HTTPS 200、Gateway health `UP`、公開 JS の新メニュー及び入口文字列 | 高 | 認証後 UI の実測は別項目 |
