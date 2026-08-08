# ホーム画面権限表示境界の調査記録

更新日: 2026-08-08
対象: OneOps 0.16.0 の Portal と互換 Gateway

## 目的

ロールから機能権限を外した利用者について、ホーム画面に当該機能の状態、接続、件数、タスク又はショートカットが残らないことを確認する。画面を隠すだけではなく、権限のないデータを dashboard API と SSE から返さないことを受入条件とする。

## 調査結果

`AuthenticatedPortal` は `GET /api/work-center/v1/dashboard` と `GET /api/work-center/v1/events` の一つのスナップショットを利用していた。従来のスナップショットには製品構築タスク、構築端末のリソース、上流接続状態、組織機関一覧が同時に含まれ、Portal は機能権限ごとの表示分岐を持っていなかった。

そのため、`dashboard.read` を持つ利用者から `builder.use`、`catalog.read` 又は `organizations.read` を外しても、ホーム画面に最近の構築タスク、システム状態、内部接続、組織機関件数、組織機関の構築履歴が残る可能性があった。SSE も接続中の全利用者へ同じ全量スナップショットを配信していた。

## ホーム画面権限マトリクス

| ホーム画面要素 | データ又は操作 | 表示条件 | Gateway 応答条件 |
| --- | --- | --- | --- |
| ホーム画面の基礎 | dashboard snapshot | `dashboard.read` | dashboard API と SSE を `dashboard.read` で認可 |
| 構築タスク件数、最近の構築タスク | Builder jobs | `builder.use` | `tasks` と構築集計を返す |
| 構築端末の CPU、メモリ、ディスク | Builder terminal status | `builder.use` | `resources` と `upstream` を返す |
| サイドバーのリアルタイム接続 | Builder events | `dashboard.read` かつ `builder.use` | 接続中クライアントごとにフィルターした SSE を返す |
| 組織機関件数、組織機関の構築履歴 | Catalog と organization directory | `catalog.read` かつ `organizations.read` | 両権限を満たす組織機関だけ集計 |
| 組織機関コンテキスト | 組織機関又は顧客情報の選択 | workbench は上記の組織機関権限、顧客情報及び構築画面は対応する参照権限 | 組織機関参照権限又は環境参照権限の対象だけ返す |
| 個人タスク概要 | personal task summary | `personal.tasks.use` | 既存の権限付き API を利用 |
| One 構築ショートカット | Builder page | `builder.use` | `builder.use` |
| 環境インベントリショートカット | 顧客情報 | `environments.read` | `environments.read` |
| 問合支援ショートカット | Inquiry support | `inquiries.use` | `inquiries.use` |

`knowledge.use`、`code.insight.use`、`reports.read` は第1階層のナビゲーション権限であり、現行ホーム画面の状態カードは持たない。これらの入口は既存のナビゲーション判定を使用する。

## 実装

1. `filterSnapshotForProfile` を追加し、dashboard 応答を会話中の利用者権限に合わせて再構成した。
2. Builder 権限がない場合はタスク、構築集計、リソース、上流状態を空値にする。
3. 組織機関は `organizations.read` 又は対象組織の `environments.read` がある場合だけ返す。組織機関件数は `catalog.read` と `organizations.read` の両方を満たす対象だけに限定した。
4. SSE は接続ごとの権限付きスナップショットを初回及び更新時に送り、5 秒ごとにセッションを再解決して組織スコープ権限の変更にも追従する。
5. Portal は権限署名を Query key に含め、権限集合が変わったときに旧スナップショットを再利用しない。Builder 権限がない場合は SSE を接続せず、サイドバーの接続カードを描画しない。
6. Workbench の状態カード、タスク表、組織機関カード、ヒーローの機能ノード、ショートカットを対応権限の条件分岐で描画する。

## 残る確認事項

静的テスト、Portal ビルド、Gateway のスナップショット単体テストは合格している。実行環境への公開後に、代理ログインで権限を外し、dashboard JSON、SSE、画面、Browser Console、スクリーンショットを一つの受入手順で確認する必要がある。
