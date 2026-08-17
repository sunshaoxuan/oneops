# 通知発生元及び作業ノード遷移調査報告

## 調査対象

個人タスク候補のシステム通知について、発生元及び重要 ID の保持、通知から具体的な作業ノードへの遷移、通知ベルと未読 Badge の一体表示を調査した。

## 確認結果

現行 Database は `user_notifications.resource_type` と `resource_id` に対象候補を記録していた。一方、通知 API は両項目を返さず、`action_path` も候補一覧を示す `/tasks?view=candidates` に固定されていた。このため、通知 Drawer から候補一覧までは移動できても、通知に対応する候補を直接開けなかった。

候補記録は `external_system_id`、`external_object_id`、`external_key` を保持している。通知へ外部 System 物理 ID と外部 Object ID を保存し、対象候補物理 ID と合わせて内部参照することで、画面へ識別情報を表示せず具体的な候補ノードを特定できる。

## 採用した契約

1. `user_notifications` は候補通知について `source_system_id` と `source_object_id` を必須とする。
2. `resource_id` は OneOps 内の対象候補物理 ID、`source_system_id` は外部 System 物理 ID、`source_object_id` は外部側 Object ID とする。
3. 通知 API は内部参照、外部参照、発生元 Code と名称を公開せず、表示内容及び解決済み Action Path だけを返す。
4. `action_path` は `/tasks?view=candidates&candidateId=<候補物理 ID>` とし、個人タスク画面は該当候補の採用 Drawer を自動的に開く。
5. 既存通知は Migration 055 で同じ契約へ更新する。
6. 通知ベルは既存 Design Token の主色 `#fd6c26` と薄色 `#fff0e9` を使用し、未読 Badge を円形操作へ重ねる。
7. 通知行全体を `role="button"` と `tabIndex=0` の選択操作として扱い、手型カーソル、Hover 背景、タイトル主色化及び `:focus-visible` 枠で操作可能状態を示す。Enter と Space は既存の通知遷移処理を呼び出す。
8. 通知行は上下 `14px`、左右 `16px` の内側余白と `8px` のカード間隔を持ち、浅い背景境界とタイトル・本文の密着を防ぐ。
9. Ant Design の実行時 `.ant-list-item` Style は単一クラスの外部 Style より後に適用されるため、通知行を `.notification-list-item.ant-list-item` として指定し、横方向の内側余白を確実に保持する。

## 外部設計確認

Ant Design の Badge は通知等の未読件数を対象要素の近傍へ表示する用途を定義し、`offset` による位置調整を提供する。現行依存関係である Ant Design を継続使用し、独自 Badge 実装を追加しない方針とした。

## 既知の境界

通知種別は今後追加できるため、発生元列は Table 全体で一律必須にせず、`PERSONAL_TASK_CANDIDATE_CREATED` に限定した Check 制約で必須化する。
