# 個人タスク候補検索条件 0.10.1 実装・受入記録

## 目的

問合せ候補を現在利用者と有効な外部状態へ限定し、条件変更後に候補を再生成できるようにする。採用済み候補と除外履歴を保持し、外部検索の全件一覧退行を候補へ保存しない。

## 実装

1. 問合せ担当者を `ME`、`SPECIFIC_ASSIGNEE`、`UNASSIGNED` の三種類へ統一した。
2. `ME` は OneOps 利用者表示名と外部担当者 Options の表示名を正規化して、単一の外部物理値へ解決する。
3. 状態値を実サイトの `open`、`close` 及び詳細状態 1 から 10 へ統一した。
4. 顧客、サブステータス、カテゴリー、分類・調査結果、キーワード及び三種類の日付期間を追加した。
5. 外部切捨て、状態不一致及び担当者不一致を 422 相当の同期失敗とし、Candidate Repository を呼び出さない。
6. External Account へ Filter Revision と最終生成 Revision を追加した。
7. 再生成時に今回返されなかった `PENDING` を `STALE` へ移す。`ADOPTED` と `DISMISSED` は維持する。
8. Candidate、Summary 及び External Account を 60 秒ごとに再取得する。
9. 接続 Drawer は `min(720px, 100vw)` とし、保存操作群を折り返して 390px 幅でも横方向へ超過しないようにした。
10. Portal 表示版数を Project Version と同じ `0.10.1` へ同期した。

## データ契約

Migration `033_harden_personal_task_candidate_generation.sql` は既存問合せ接続を `ME` へ統一し、Cursor を初期化する。同期履歴には Filter Revision と Stale 件数を保存する。候補は外部接続 ID と外部オブジェクト ID の一意制約を継続使用する。

## 制約

外部結果が表示上限を超える条件は候補生成に使用できない。条件を追加して上限未満へ絞り込む必要がある。本人表示名が外部 Options で一意に解決できない場合は指定担当者を使用する。

## 本番受入結果

2026 年 8 月 6 日 12 時 54 分に実画面から問合せ接続の候補再生成を実行した。Filter Revision 2 の検索結果は 0 件であり、旧 Filter Revision 1 に属する CLOSED 候補 500 件はすべて `STALE` へ移行した。`filter_revision` と `last_generated_filter_revision` はともに 2 となった。

13 時 00 分の最終配信後、`/tasks` は `v0.10.1`、新しい候補 0 件、問合せ状態 `all`、`open`、`close`、担当者指定 `ME`、`SPECIFIC_ASSIGNEE`、`UNASSIGNED` を表示した。1265px と 390px の両幅で横方向超過はなく、Console の Error と Warning は 0 件だった。

Backlog 接続は外部応答 500 により定期同期が失敗している。問合せ接続の候補生成と本受入結果には影響しない。Backlog 側接続設定は別途調査対象とする。
