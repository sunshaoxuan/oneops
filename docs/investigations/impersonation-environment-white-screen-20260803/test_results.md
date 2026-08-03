# 試験結果

## 修正前確認

- 実 PostgreSQL 代理ログイン試験は、環境応答直下に `organizationId` が存在せず失敗しました。
- 失敗時の実応答は `inventory` 包装を含み、契約差分を確認しました。

## 修正後確認

- `ImpersonationEnvironmentApiDatabaseTest`: 成功 1 件
- `auth-session-state.test.ts`: 成功 1 件
- `EnvironmentPage.viewer.test.tsx`: 成功 3 件

## 完全試験

- Spring Boot: 成功 20 件、失敗 0 件、スキップ 0 件
- Agent Gateway: 成功 147 件
- Python Worker: 成功 7 件
- Portal: 成功 124 件
- Portal 本番ビルド: 成功
- Vite のチャンク容量警告は既知の非失敗警告として記録しました。

## 公開後確認

- 配布スクリプト: 成功
- Nginx 設定検査: 成功
- Spring Boot 稼働状態: `UP`
- Spring Boot バージョン: `0.8.2`
- 正式サイト `/environments`: HTTP 200
- 配布済み画面資源: `OneOps v0.8.2` を確認
- 管理者から既存の閲覧者 `x02419` への代理ログイン: 成功
- 代理ログイン後の環境情報画面: 白画面を再現せず、環境インベントリを表示
- ブラウザーコンソールの警告とエラー: 0 件
- 画面確認後の代理ログイン終了: 成功

初回配布では Spring Boot JAR の再パッケージ前成果物を検出し、ヘルスチェックが失敗しました。配布スクリプトによる画面索引の自動ロールバックを確認後、実行可能 JAR を再生成して再配布しました。
