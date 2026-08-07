# 第1階層機能の権限登録 調査報告

## 目的

左側ナビゲーションの「製品構築」「ナレッジ」「コードインサイト」「レポート」がロール権限マトリクスに表示されず、`dashboard.read` だけで入口と製品構築 API を利用できる状態を確認し、機能ごとの権限境界を揃える。

## 調査結果

1. Portal の `navigation` は四つの機能を定義しているが、`App.tsx` の権限判定で個別分岐がなく、共通の `dashboard.read` 判定へ到達していた。
2. `app/db/migrations/009_create_identity_and_rbac.sql` 及び後続の権限定義には、四つの機能に対応する `builder.use`、`knowledge.use`、`code.insight.use`、`reports.read` が存在しなかった。
3. ロール権限 API はデータベースの `permissions` をそのまま返し、Portal のマトリクスは API の資源及び操作を行へ変換するため、データベースに権限がない機能は画面にも表示されない。
4. 製品構築の Gateway 境界は `/api/work-center/v1/builder/` 全体を `dashboard.read` で保護していた。ナレッジ、コードインサイト、レポートには現時点で専用 API はなく、Portal の入口権限が主要な認可境界となる。

## 権限設計

| 機能 | Permission Code | 操作 | 認可対象 |
| --- | --- | --- | --- |
| 製品構築 | `builder.use` | 利用 | Portal 入口、画面、履歴、端末、構築、ログ、成果物及び Gateway proxy |
| ナレッジ | `knowledge.use` | 利用 | Portal 入口及びナレッジ業務機能 |
| コードインサイト | `code.insight.use` | 利用 | Portal 入口及び差分調査機能 |
| レポート | `reports.read` | 閲覧 | Portal 入口及びレポート参照 |

`read` は情報の閲覧、`use` は業務機能の実行を表す。製品構築、ナレッジ、コードインサイトは処理を起動する機能であり、レポートは情報の閲覧機能である。

## 実装範囲

- `036_add_portal_navigation_permissions.sql` に四つの権限定義と標準三ロールへの初期割当を追加した。
- `portal-navigation.ts` に第1階層と Permission Code の対応表を追加し、Portal の入口判定が機能ごとの権限を使用するようにした。
- `auth.mjs` の製品構築 Gateway 境界を `builder.use` へ変更した。
- `permission-matrix.ts` の表示順へ四つの資源を追加し、`IdentityManagementPage.tsx` に日本語、中国語、英語の資源名と権限名を追加した。
- 関連する Portal、Gateway、Migration の単体試験と静的契約試験を追加した。

## 制約と残課題

ナレッジ、コードインサイト、レポートは現時点で共通 `ModulePage` の入口であり、専用のデータ取得 API は存在しない。専用 API を追加する場合は、それぞれの Permission Code を Gateway の要求経路へ明示的に接続する。
