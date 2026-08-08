# 証拠一覧

| ID | 証拠 | 内容 | 状態 |
| --- | --- | --- | --- |
| E-01 | `app/apps/portal-shell/src/App.tsx` | dashboard Query、SSE、WorkBench、接続カード、状態カード、Quick Tools の表示分岐 | 確認済み |
| E-02 | `app/packages/api-client/src/index.ts` | dashboard snapshot と SSE の API 契約 | 確認済み |
| E-03 | `app/gateway/auth.mjs` | dashboard、Builder、環境、個人タスク、問合支援の API 権限対応 | 確認済み |
| E-04 | `app/gateway/server.mjs` | dashboard と SSE の認証及びスナップショット送信経路 | 修正済み |
| E-05 | `app/gateway/lib.mjs` | `filterSnapshotForProfile` によるデータフィルター | 修正済み |
| E-06 | `app/gateway/lib.test.mjs` | Builder データ除外、組織機関権限、組織スコープの単体テスト | 合格 |
| E-07 | `app/apps/portal-shell/src/homepage-permissions.test.ts` | ホーム画面の Query、SSE、状態カード、ショートカットの静的テスト | 合格 |
| E-08 | `app/apps/portal-shell/src/auth-ui.test.ts` | dashboard 権限変更時の Query と表示境界の検査 | 合格 |
| E-09 | `app/db/migrations/009_create_identity_and_rbac.sql` | dashboard、catalog、organization、environment 権限の定義 | 確認済み |
| E-10 | `app/db/migrations/036_add_portal_navigation_permissions.sql` | Builder、Knowledge、Code Insight、Reports のナビゲーション権限 | 確認済み |

## 制約

E-01 から E-10 はローカルソースとローカルテストの証拠である。公開後の Browser、Console、HTTPS 応答及び代理ログインの実データ証拠は、実行環境検証の結果を `test_results.md` と `FINAL_ACCEPTANCE_CHECKLIST.md` に追記する。
