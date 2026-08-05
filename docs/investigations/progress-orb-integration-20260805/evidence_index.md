# 証拠索引

| 主張 | 証拠 | 信頼度 | 制約 |
|---|---|---|---|
| 公式ライブラリ名と利用方法 | `https://orbs.jakubantalik.com/` の公式デモ、`npm install thinking-orbs`、`ThinkingOrb` の使用例 | 高 | 公式デモの調査時点に依存 |
| 公開版と互換条件 | npm レジストリの `thinking-orbs@0.2.0` metadata、取得済み型定義 | 高 | 将来の公開版変更は再確認が必要 |
| Portal へ依存を追加 | `app/apps/portal-shell/package.json:21`、`app/pnpm-lock.yaml:56`、`app/pnpm-lock.yaml:1748` | 高 | 正式公開状態は別途確認 |
| 共通入口を追加 | `app/apps/portal-shell/src/ProgressOrb.tsx:1` | 高 | コンポーネント単体の契約確認はテストに分離 |
| ワークベンチへ適用 | `app/apps/portal-shell/src/App.tsx:1340` 付近、`app/apps/portal-shell/src/App.tsx:1475` 付近 | 高 | 認証後画面の実表示はブラウザー証跡を参照 |
| レイアウトと狭幅画面の境界を追加 | `app/apps/portal-shell/src/styles.css:636` 付近、`app/apps/portal-shell/src/styles.css:701` 付近 | 高 | 640px の実画面で確認済み |
| 単体テスト | `app/apps/portal-shell/src/ProgressOrb.test.tsx` | 高 | 第三者キャンバスはテストダブル |
| Portal 全体検証 | `pnpm check` の 177 Gateway、14 Worker、149 Portal、Production Build | 高 | Nginx の正式ローリング公開は別管理 |
| ブラウザー表示とコンソール | `docs/evidence/thinking-orbs-workbench-desktop-20260805.png`、`docs/evidence/thinking-orbs-workbench-640-20260805.png`、ブラウザー DOM と console | 高 | 正式 HTTPS の認証済みワークベンチで確認 |
