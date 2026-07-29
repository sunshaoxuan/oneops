# 証拠索引

| 主張 | 証拠 | 確度 | 制約 |
| --- | --- | --- | --- |
| 権限データは機能ノードと操作を保持する | `app/packages/api-client/src/index.ts` の `Permission.resource`、`Permission.action` | 高 | なし |
| 旧 UI は平面チェックボックス一覧だった | 変更前の `IdentityManagementPage.tsx` と利用者提示画像 | 高 | なし |
| 新 UI は機能ノード行と操作列のマトリクスである | `app/apps/portal-shell/src/IdentityManagementPage.tsx`、`permission-matrix.ts` | 高 | なし |
| マトリクス変換と順序がテスト済みである | `permission-matrix.test.ts`、Vitest 84 件成功 | 高 | なし |
| 正式リリースが成功した | `app/logs/continuous-delivery.log` の `role-permission-matrix-final` | 高 | なし |
| UI 表示と操作が確認済みである | `docs/evidence/role-permission-matrix-20260729.png`、ブラウザー操作結果 | 高 | 認証後画面はローカル受入フィクスチャ |
| コンソールに警告とエラーがない | 独立した最終ブラウザー検証結果 `[]` | 高 | ローカル受入フィクスチャ |
