# 証拠一覧

| 主張 | 証拠 | 信頼度 | 制限 |
|---|---|---|---|
| 参考画面は製品構築用のワークスペースである | `app/builder/host_standalone_console.py` の `PRODUCT DELIVERY WORKSPACE`、製品構築 iframe の実行時 DOM | 高 | 参考画像の元ファイル自体は一時クリップボード画像 |
| 主要画面へ共通見出しクラスを適用した | `app/apps/portal-shell/src/App.tsx`、`CustomerInformationPage.tsx`、`PersonalTasksPage.tsx`、`InquirySupportPage.tsx` | 高 | 画面固有の本文カードは既存構造を維持 |
| 管理区画へ共通見出しクラスを適用した | `IdentityManagementPage.tsx`、`WorkforcePolicyPages.tsx`、`ModelDesignPage.tsx`、`InquirySupportSettingsPage.tsx` | 高 | 権限により表示される管理区画は実ユーザー権限に依存 |
| レスポンシブ境界に横方向のページ溢れがない | 640px ブラウザー評価結果 `viewport=640`、`scrollWidth=640` | 高 | タブ内部の表示項目は Ant Design の横スクロール表示を使用 |
| ブラウザーコンソールに新規警告又はエラーがない | 顧客情報、個人タスク、システム管理の `tab.dev.logs({levels:["error","warn"]})` 結果が空 | 高 | 認証済み実行時点の結果 |
| 静的配信が成功した | `app/logs/continuous-delivery.log` の `delivery_succeeded reason=portal-design-language-20260805`、HTTPS 200、Nginx 設定検査成功 | 高 | Git のコミット及び Push はこの記録の後に実施 |
| API や保存動作に影響がない | 全プロジェクトテスト 173 件、Python 14 件、Portal 142 件の合格 | 高 | 外部サービスの業務データ変更操作は実施していない |
